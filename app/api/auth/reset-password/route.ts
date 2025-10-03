import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { serverLogger as logger } from "@/lib/logger";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Hash the token to match stored hash
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired reset token. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info("Password reset successful", {
      userId: user._id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now sign in.",
    });
  } catch (error) {
    logger.error("Reset password error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
