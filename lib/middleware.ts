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

  if (!existing || now > existing.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  existing.count++;
  return true;
}

/**
 * Verify JWT token and extract user information with enhanced logging
 */
export async function verifyAuth(
  request: NextRequest,
): Promise<AuthenticatedRequest["user"] | null> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      logger.debug("No authorization token found in request");
      return null;
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      logger.warn("Invalid or expired access token");
      return null;
    }

    // Connect to database to get additional user info
    await connectDB();
    const User = (await import("../models/User")).default;
    const user = await User.findById(decodedToken.id).select(
      "-password -refreshToken",
    );

    if (!user) {
      logger.warn("User not found for valid token", {
        userId: decodedToken.id,
      });
      return null;
    }

    // Check if user account is active
    if (user.status === "suspended") {
      logger.warn("Suspended user attempted access", { userId: user._id });
      return null;
    }

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
    try {
      const user = await verifyAuth(request);

      if (!user) {
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
      (request as AuthenticatedRequest).user = user;

      return await handler(request as AuthenticatedRequest);
    } catch (error) {
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
      try {
        const user = request.user!;

        // Validate permission
        validatePermission(user.userType, permission, user.id);

        logger.debug("Permission granted", {
          userId: user.id,
          userType: user.userType,
          permission,
          path: request.nextUrl.pathname,
        });

        return await handler(request);
      } catch (error) {
        if (error instanceof AuthorizationError) {
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
      try {
        const user = request.user!;
        const resourceOwnerId = await getResourceOwnerId(request);

        // Admin can access any resource
        if (user.userType !== "admin") {
          validateResourceOwnership(resourceOwnerId, user.id, resourceType);
        }

        return await handler(request);
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return NextResponse.json(
            {
              error: error.message,
              code: "RESOURCE_ACCESS_DENIED",
              timestamp: new Date().toISOString(),
            },
            { status: 403 },
          );
        }

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

      // Use in-memory rate limiting (can be upgraded to Redis later)
      const allowed = rateLimitFallback(identifier);

      if (!allowed) {
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

      return await handler(request);
    } catch (error) {
      logger.error("Rate limiting middleware error", {
        error: error instanceof Error ? error.message : String(error),
      });

      // If rate limiting fails, allow the request to proceed
      return await handler(request);
    }
  };
}
