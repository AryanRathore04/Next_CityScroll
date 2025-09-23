import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { withRateLimit } from "@/lib/middleware";

export const dynamic = "force-dynamic";

async function verifyTokenHandler(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 },
      );
    }

    // Verify the access token
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Connect to database and get user profile
    await connectDB();
    const User = (await import("../../../../models/User")).default;
    const user = await User.findById(decodedToken.id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user information
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        verified: user.verified,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error("Token verification error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

// Export with rate limiting
export const POST = withRateLimit(verifyTokenHandler);
