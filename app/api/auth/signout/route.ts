import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  extractRefreshTokenFromCookie,
  clearRefreshTokenCookie,
} from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { withRateLimit } from "@/lib/middleware";

export const dynamic = "force-dynamic";

async function signoutHandler(request: NextRequest) {
  try {
    // Extract refresh token from HttpOnly cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshToken = extractRefreshTokenFromCookie(cookieHeader);

    if (refreshToken) {
      try {
        // Verify and get user ID from refresh token
        const decoded = verifyRefreshToken(refreshToken);

        if (decoded) {
          // Connect to database and clear stored refresh token
          await connectDB();
          const User = (await import("../../../../models/User")).default;

          // Clear the refresh token from the database
          await User.findByIdAndUpdate(
            decoded.id,
            { $unset: { refreshToken: 1 } },
            { new: true },
          );
        }
      } catch (error) {
        // Even if token verification fails, we should still clear the cookie
        console.warn("Error verifying refresh token during signout:", error);
      }
    }

    // Create response with success message
    const response = NextResponse.json({
      success: true,
      message: "Successfully signed out",
    });

    // Clear the HttpOnly refresh token cookie
    const clearCookie = clearRefreshTokenCookie();
    response.headers.set("Set-Cookie", clearCookie);

    return response;
  } catch (error) {
    console.error("Signout error:", error);

    // Even if there's an error, we should clear the cookie
    const response = NextResponse.json(
      { error: "Signout failed" },
      { status: 500 },
    );

    // Clear the HttpOnly refresh token cookie
    const clearCookie = clearRefreshTokenCookie();
    response.headers.set("Set-Cookie", clearCookie);

    return response;
  }
}

export const POST = withRateLimit(signoutHandler);
