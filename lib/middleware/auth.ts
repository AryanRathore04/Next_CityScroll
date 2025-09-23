import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

export interface AuthenticatedUser {
  id: string;
  email: string;
  userType: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

/**
 * Middleware to protect API routes requiring authentication
 * Usage: export const GET = requireAuth(async (request: AuthenticatedRequest) => { ... });
 */
export function requireAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>,
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Extract access token from Authorization header
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (!token) {
        return NextResponse.json(
          { error: "Access token required" },
          { status: 401 },
        );
      }

      // Verify access token
      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return NextResponse.json(
          { error: "Invalid or expired access token" },
          { status: 401 },
        );
      }

      // Add user info to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: decoded.id,
        email: decoded.email,
        userType: decoded.userType,
      };

      // Call the protected handler
      return await handler(authenticatedRequest, ...args);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 },
      );
    }
  };
}

/**
 * Middleware to protect routes for specific user types
 * Usage: export const GET = requireRole(['vendor', 'admin'])(async (request: AuthenticatedRequest) => { ... });
 */
export function requireRole(allowedRoles: string[]) {
  return function <T extends any[]>(
    handler: (
      request: AuthenticatedRequest,
      ...args: T
    ) => Promise<NextResponse>,
  ) {
    return requireAuth(async (request: AuthenticatedRequest, ...args: T) => {
      if (!allowedRoles.includes(request.user.userType)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }

      return await handler(request, ...args);
    });
  };
}
