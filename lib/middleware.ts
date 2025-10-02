import { NextRequest, NextResponse } from "next/server";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  JWTPayload,
} from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import {
  PERMISSIONS,
  hasPermission,
  validatePermission,
  validateResourceOwnership,
  type Permission,
  type UserRole,
} from "@/lib/permissions";
import {
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
} from "@/lib/errors";
import { serverLogger as logger } from "@/lib/logger";

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    userType: "customer" | "vendor" | "admin";
    firstName?: string;
    lastName?: string;
  };
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Simple in-memory rate limiting (fallback when KV is not available)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitFallback(identifier: string): boolean {
  const now = Date.now();
  const existing = requestCounts.get(identifier);

  console.log("🔵 [MIDDLEWARE] rateLimitFallback() checking:", {
    identifier,
    now,
    existing: existing
      ? {
          count: existing.count,
          resetTime: existing.resetTime,
          timeLeft: existing.resetTime - now,
        }
      : null,
    maxRequests: MAX_REQUESTS_PER_WINDOW,
  });

  if (!existing || now > existing.resetTime) {
    console.log("🟢 [MIDDLEWARE] Rate limit window reset or first request");
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    console.log("🔴 [MIDDLEWARE] Rate limit exceeded:", {
      currentCount: existing.count,
      maxRequests: MAX_REQUESTS_PER_WINDOW,
      timeUntilReset: existing.resetTime - now,
    });
    return false;
  }

  existing.count++;
  console.log(
    "🟢 [MIDDLEWARE] Request allowed, count incremented to:",
    existing.count,
  );
  return true;
}

/**
 * Verify JWT token and extract user information with enhanced logging
 */
export async function verifyAuth(
  request: NextRequest,
): Promise<AuthenticatedRequest["user"] | null> {
  console.log("🔵 [MIDDLEWARE] verifyAuth() called for:", {
    method: request.method,
    path: request.nextUrl.pathname,
    hasAuth: !!request.headers.get("authorization"),
  });

  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      console.log("🔴 [MIDDLEWARE] No authorization token found in request");
      logger.debug("No authorization token found in request");
      return null;
    }

    console.log("🔵 [MIDDLEWARE] Authorization token found, verifying...");

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      console.log("🔴 [MIDDLEWARE] Invalid or expired access token");
      logger.warn("Invalid or expired access token");
      return null;
    }

    console.log("🟢 [MIDDLEWARE] Token verified, payload:", {
      userId: decodedToken.id,
      userType: decodedToken.userType,
      email: decodedToken.email,
    });

    // Connect to database to get additional user info
    console.log("🔵 [MIDDLEWARE] Connecting to database to fetch user data...");
    await connectDB();
    const User = (await import("../models/User")).default;
    const user = await User.findById(decodedToken.id).select(
      "-password -refreshToken",
    );

    if (!user) {
      console.log(
        "🔴 [MIDDLEWARE] User not found in database for token userId:",
        decodedToken.id,
      );
      logger.warn("User not found for valid token", {
        userId: decodedToken.id,
      });
      return null;
    }

    console.log("🟢 [MIDDLEWARE] User found in database:", {
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType,
      status: user.status,
    });

    // Check if user account is active
    if (user.status === "suspended") {
      console.log(
        "🔴 [MIDDLEWARE] Suspended user attempted access:",
        user._id.toString(),
      );
      logger.warn("Suspended user attempted access", { userId: user._id });
      return null;
    }

    console.log("🟢 [MIDDLEWARE] User authenticated successfully:", {
      userId: user._id.toString(),
      userType: user.userType,
      status: user.status,
    });

    logger.debug("User authenticated successfully", {
      userId: user._id,
      userType: user.userType,
    });

    return {
      id: user._id.toString(),
      email: user.email,
      userType: user.userType as UserRole,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  } catch (error) {
    console.error("🔴 [MIDDLEWARE] Token verification failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    logger.error("Token verification failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Enhanced middleware to require authentication with error handling
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    console.log("🔵 [MIDDLEWARE] requireAuth() middleware called for:", {
      method: request.method,
      path: request.nextUrl.pathname,
    });

    try {
      const user = await verifyAuth(request);

      if (!user) {
        console.log("🔴 [MIDDLEWARE] Authentication failed, returning 401");
        logger.warn("Unauthenticated request attempt", {
          path: request.nextUrl.pathname,
          method: request.method,
        });

        return NextResponse.json(
          {
            error: "Authentication required",
            code: "AUTH_REQUIRED",
            timestamp: new Date().toISOString(),
          },
          { status: 401 },
        );
      }

      // Attach user to request
      console.log(
        "🟢 [MIDDLEWARE] Authentication successful, attaching user to request",
      );
      (request as AuthenticatedRequest).user = user;

      console.log("🔵 [MIDDLEWARE] Calling protected handler...");
      const result = await handler(request as AuthenticatedRequest);
      console.log("🟢 [MIDDLEWARE] Protected handler completed successfully");
      return result;
    } catch (error) {
      console.error("🔴 [MIDDLEWARE] Authentication middleware error:", {
        error: error instanceof Error ? error.message : String(error),
        path: request.nextUrl.pathname,
        stack: error instanceof Error ? error.stack : undefined,
      });

      logger.error("Authentication middleware error", {
        error: error instanceof Error ? error.message : String(error),
        path: request.nextUrl.pathname,
      });

      return NextResponse.json(
        {
          error: "Authentication failed",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Enhanced middleware to require specific permission (replaces requireRole)
 */
export function requirePermission(
  permission: Permission,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return requireAuth(
    async (request: AuthenticatedRequest): Promise<NextResponse> => {
      console.log("🔵 [MIDDLEWARE] requirePermission() checking permission:", {
        userId: request.user?.id,
        userType: request.user?.userType,
        requiredPermission: permission,
        path: request.nextUrl.pathname,
      });

      try {
        const user = request.user!;

        // Validate permission
        console.log("🔵 [MIDDLEWARE] Validating permission for user...");
        validatePermission(user.userType, permission, user.id);
        console.log("🟢 [MIDDLEWARE] Permission validation successful");

        logger.debug("Permission granted", {
          userId: user.id,
          userType: user.userType,
          permission,
          path: request.nextUrl.pathname,
        });

        console.log("🟢 [MIDDLEWARE] Permission granted, calling handler");
        const result = await handler(request);
        console.log(
          "🟢 [MIDDLEWARE] Permission-protected handler completed successfully",
        );
        return result;
      } catch (error) {
        if (error instanceof AuthorizationError) {
          console.log("🔴 [MIDDLEWARE] Permission denied:", {
            userId: request.user?.id,
            userType: request.user?.userType,
            requiredPermission: permission,
            path: request.nextUrl.pathname,
            error: error.message,
          });

          logger.warn("Permission denied", {
            userId: request.user?.id,
            userType: request.user?.userType,
            requiredPermission: permission,
            path: request.nextUrl.pathname,
          });

          return NextResponse.json(
            {
              error: error.message,
              code: "INSUFFICIENT_PERMISSIONS",
              requiredPermission: permission,
              timestamp: new Date().toISOString(),
            },
            { status: 403 },
          );
        }

        console.error("🔴 [MIDDLEWARE] Permission middleware error:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        logger.error("Permission middleware error", {
          error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
          {
            error: "Authorization failed",
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        );
      }
    },
  );
}

/**
 * Middleware to require resource ownership (for user-specific resources)
 */
export function requireResourceOwnership(
  getResourceOwnerId: (req: AuthenticatedRequest) => Promise<string> | string,
  resourceType: string,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return requireAuth(
    async (request: AuthenticatedRequest): Promise<NextResponse> => {
      console.log(
        "🔵 [MIDDLEWARE] requireResourceOwnership() checking ownership for:",
        {
          userId: request.user?.id,
          userType: request.user?.userType,
          resourceType,
          path: request.nextUrl.pathname,
        },
      );

      try {
        const user = request.user!;
        const resourceOwnerId = await getResourceOwnerId(request);

        console.log("🔵 [MIDDLEWARE] Resource owner ID retrieved:", {
          resourceOwnerId,
          currentUserId: user.id,
          userType: user.userType,
        });

        // Admin can access any resource
        if (user.userType !== "admin") {
          console.log(
            "🔵 [MIDDLEWARE] Validating resource ownership (non-admin user)...",
          );
          validateResourceOwnership(resourceOwnerId, user.id, resourceType);
          console.log(
            "🟢 [MIDDLEWARE] Resource ownership validation successful",
          );
        } else {
          console.log("🟢 [MIDDLEWARE] Admin user - bypassing ownership check");
        }

        console.log("🟢 [MIDDLEWARE] Resource access granted, calling handler");
        const result = await handler(request);
        console.log(
          "🟢 [MIDDLEWARE] Resource ownership protected handler completed",
        );
        return result;
      } catch (error) {
        if (error instanceof AuthorizationError) {
          console.log("🔴 [MIDDLEWARE] Resource access denied:", {
            userId: request.user?.id,
            resourceType,
            error: error.message,
          });

          return NextResponse.json(
            {
              error: error.message,
              code: "RESOURCE_ACCESS_DENIED",
              timestamp: new Date().toISOString(),
            },
            { status: 403 },
          );
        }

        console.error(
          "🔴 [MIDDLEWARE] Unexpected error in requireResourceOwnership:",
          {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        );

        throw error;
      }
    },
  );
}

/**
 * Legacy middleware - kept for backward compatibility but deprecated
 * @deprecated Use requirePermission instead
 */
export function requireRole(
  role: UserRole,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  if (process.env.NODE_ENV === "development") {
    logger.warn("requireRole is deprecated, use requirePermission instead");
  }

  return requireAuth(
    async (request: AuthenticatedRequest): Promise<NextResponse> => {
      const userType = request.user?.userType;

      if (userType !== role) {
        return NextResponse.json(
          {
            error: "Insufficient permissions",
            code: "ROLE_MISMATCH",
            timestamp: new Date().toISOString(),
          },
          { status: 403 },
        );
      }

      return handler(request);
    },
  );
}

/**
 * Enhanced middleware to apply rate limiting with better logging
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  customWindow?: number,
  customMaxRequests?: number,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    console.log("🔵 [MIDDLEWARE] withRateLimit() called for:", {
      method: request.method,
      path: request.nextUrl.pathname,
    });

    try {
      // Use IP address as identifier
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded
        ? forwarded.split(",")[0].trim()
        : request.headers.get("x-real-ip") ||
          request.headers.get("cf-connecting-ip") ||
          "unknown";

      const identifier = `${ip}:${request.nextUrl.pathname}`;
      const window = customWindow || RATE_LIMIT_WINDOW;
      const maxRequests = customMaxRequests || MAX_REQUESTS_PER_WINDOW;

      console.log("🔵 [MIDDLEWARE] Rate limit check for:", {
        ip,
        identifier,
        window,
        maxRequests,
        path: request.nextUrl.pathname,
      });

      // Use in-memory rate limiting (can be upgraded to Redis later)
      const allowed = rateLimitFallback(identifier);

      console.log("🔵 [MIDDLEWARE] Rate limit check result:", {
        allowed,
        ip,
        identifier,
      });

      if (!allowed) {
        console.log("🔴 [MIDDLEWARE] Rate limit exceeded:", {
          ip,
          path: request.nextUrl.pathname,
          method: request.method,
          identifier,
          window,
          maxRequests,
        });

        logger.warn("Rate limit exceeded", {
          ip,
          path: request.nextUrl.pathname,
          method: request.method,
          userAgent: request.headers.get("user-agent"),
        });

        return NextResponse.json(
          {
            error: "Too many requests. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: Math.ceil(window / 1000),
            timestamp: new Date().toISOString(),
          },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(window / 1000).toString(),
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Window": window.toString(),
            },
          },
        );
      }

      console.log("🟢 [MIDDLEWARE] Rate limit check passed, calling handler");
      const result = await handler(request);
      console.log(
        "🟢 [MIDDLEWARE] Rate limited handler completed successfully",
      );
      return result;
    } catch (error) {
      console.error("🔴 [MIDDLEWARE] Rate limiting middleware error:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      logger.error("Rate limiting middleware error", {
        error: error instanceof Error ? error.message : String(error),
      });

      // If rate limiting fails, allow the request to proceed
      console.log(
        "⚠️ [MIDDLEWARE] Rate limiting failed, proceeding with request",
      );
      return await handler(request);
    }
  };
}
