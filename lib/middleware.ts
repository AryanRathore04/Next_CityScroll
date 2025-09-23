import { NextRequest, NextResponse } from "next/server";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  JWTPayload,
} from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

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
 * Verify JWT token and extract user information
 */
export async function verifyAuth(
  request: NextRequest,
): Promise<AuthenticatedRequest["user"] | null> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return null;
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      return null;
    }

    // Connect to database to get additional user info
    await connectDB();
    const User = (await import("../models/User")).default;
    const user = await User.findById(decodedToken.id).select("-password");

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Attach user to request
    (request as AuthenticatedRequest).user = user;

    return handler(request as AuthenticatedRequest);
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(
  role: string,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return requireAuth(
    async (request: AuthenticatedRequest): Promise<NextResponse> => {
      const userType = request.user?.userType;

      if (userType !== role) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }

      return handler(request);
    },
  );
}

/**
 * Middleware to apply rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Use IP address as identifier
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";
    const identifier = `${ip}:${request.nextUrl.pathname}`;

    // Use in-memory rate limiting (can be upgraded to Redis later)
    const allowed = rateLimitFallback(identifier);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
          },
        },
      );
    }

    return handler(request);
  };
}
