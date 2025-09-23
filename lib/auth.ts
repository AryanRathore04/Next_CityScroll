import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable");
}

if (!JWT_REFRESH_SECRET) {
  throw new Error("Please define the JWT_REFRESH_SECRET environment variable");
}

export interface JWTPayload {
  id: string;
  email: string;
  userType: "customer" | "vendor" | "admin";
  iat?: number;
  exp?: number;
}

// Generate access token (short-lived: 15 minutes)
export function generateAccessToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

// Generate refresh token (long-lived: 7 days)
export function generateRefreshToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error("Access token verification failed:", error);
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Extract token from Authorization header
export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// Generate both tokens
export function generateTokens(payload: Omit<JWTPayload, "iat" | "exp">) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Create HttpOnly refresh token cookie string
 */
export function createRefreshTokenCookie(refreshToken: string): string {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = [
    `refreshToken=${refreshToken}`,
    `Path=/`, // make available site-wide so client can send it to /api/auth/refresh
    `HttpOnly`, // prevent JS access
    `SameSite=Strict`, // CSRF protection
    isProduction ? `Secure` : ``, // HTTPS only in production
    `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
  ]
    .filter(Boolean)
    .join("; ");

  return cookieOptions;
}

/**
 * Create cookie to clear refresh token
 */
export function clearRefreshTokenCookie(): string {
  return `refreshToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

/**
 * Extract refresh token from cookie string
 */
export function extractRefreshTokenFromCookie(
  cookieHeader?: string | null,
): string | null {
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|; )refreshToken=([^;]+)/);
  return match ? match[1] : null;
}

// Auth middleware for protecting routes
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: string;
  };
}

export const requireAuth = (
  handler: (req: AuthenticatedRequest) => Promise<Response>,
) => {
  return async (request: Request): Promise<Response> => {
    try {
      // Extract access token from Authorization header
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (!token) {
        return new Response(
          JSON.stringify({ error: "Access token required" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      // Verify access token
      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired access token" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
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
      return await handler(authenticatedRequest);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
};
