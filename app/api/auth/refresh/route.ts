import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  extractRefreshTokenFromCookie,
  createRefreshTokenCookie,
} from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { withRateLimit } from "@/lib/middleware";

export const dynamic = "force-dynamic";

async function refreshTokenHandler(request: NextRequest) {
  try {
    // Extract refresh token from HttpOnly cookie
    const cookieHeader = request.headers.get("cookie") || "";
    // Log incoming cookie header for diagnostics
    console.log("[auth/refresh] incoming Cookie header:", cookieHeader);
    const refreshToken = extractRefreshTokenFromCookie(cookieHeader);

    if (refreshToken) {
      // Log only the first/last few chars of the token to avoid leaking full token in logs
      const masked = `${refreshToken.slice(0, 8)}...${refreshToken.slice(-8)}`;
      console.log("[auth/refresh] extracted refresh token (masked):", masked);
    } else {
      console.log("[auth/refresh] no refresh token found in cookies");
    }

    if (!refreshToken) {
      console.warn("[auth/refresh] missing refresh token - returning 401");
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 401 },
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      console.warn(
        "[auth/refresh] refresh token verification failed - invalid or expired",
      );
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    // Handle test users (they don't exist in database)
    if (decoded.id.startsWith("test-")) {
      console.log("[auth/refresh] handling test user:", decoded.id);

      // Generate new tokens for test user
      const accessToken = generateAccessToken({
        id: decoded.id,
        email: decoded.email,
        userType: decoded.userType,
      });

      const newRefreshToken = generateRefreshToken({
        id: decoded.id,
        email: decoded.email,
        userType: decoded.userType,
      });

      // Set new refresh token in HttpOnly cookie
      const refreshCookie = createRefreshTokenCookie(newRefreshToken);

      const response = NextResponse.json({
        success: true,
        accessToken,
        user: {
          id: decoded.id,
          email: decoded.email,
          userType: decoded.userType,
          firstName: "Test",
          lastName: "User",
        },
      });

      response.headers.set("Set-Cookie", refreshCookie);
      return response;
    }

    // Connect to database and verify user still exists with stored refresh token
    await connectDB();
    const User = (await import("../../../../models/User")).default;
    const user = await User.findById(decoded.id).select(
      "-password +refreshToken",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the refresh token matches what's stored in the database
    if (user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 },
      );
    }

    // Check if user account is still active
    if (user.status === "suspended") {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    // Generate new tokens (token rotation)
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      userType: user.userType,
    });

    const newRefreshToken = generateRefreshToken({
      id: user._id.toString(),
      email: user.email,
      userType: user.userType,
    });

    // Update stored refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new refresh token in HttpOnly cookie
    const refreshCookie = createRefreshTokenCookie(newRefreshToken);

    const response = NextResponse.json({
      success: true,
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    // Set the HttpOnly cookie
    response.headers.set("Set-Cookie", refreshCookie);

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(refreshTokenHandler);
