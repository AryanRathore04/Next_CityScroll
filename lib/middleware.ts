import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { kv } from "@vercel/kv";

interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    role?: string;
    customClaims?: any;
  };
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Rate limiting middleware using Vercel KV (Redis)
 */
export async function rateLimit(
  request: NextRequest,
  identifier: string,
): Promise<boolean> {
  try {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Use Redis sorted set to track requests in time window
    await kv.zremrangebyscore(key, 0, windowStart);
    const requestCount = await kv.zcard(key);

    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
      return false; // Rate limit exceeded
    }

    // Add current request
    await kv.zadd(key, { score: now, member: now.toString() });
    await kv.expire(key, Math.ceil(RATE_LIMIT_WINDOW / 1000));

    return true; // Request allowed
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If rate limiting fails, allow the request (fail open)
    return true;
  }
}

/**
 * Simple in-memory rate limiting fallback
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
 * Verify Firebase ID token and extract user information
 */
export async function verifyAuth(
  request: NextRequest,
): Promise<AuthenticatedRequest["user"] | null> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role: decodedToken.role || "customer",
      customClaims: decodedToken,
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
      const userRole = request.user?.role;

      if (userRole !== role) {
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

    // Try KV rate limiting first, fallback to in-memory
    let allowed: boolean;
    try {
      allowed = await rateLimit(request, identifier);
    } catch (error) {
      console.warn("KV rate limiting failed, using fallback:", error);
      allowed = rateLimitFallback(identifier);
    }

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
