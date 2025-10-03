import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { serverLogger as logger } from "@/lib/logger";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success (don't reveal if email exists for security)
    if (!user) {
      logger.info("Password reset requested for non-existent email", {
        email,
      });
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save reset token to user (expires in 1 hour)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // In production, send email with reset link
    // For now, just log the token (in production, send via email service)
    const resetUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    logger.info("Password reset token generated", {
      userId: user._id,
      email: user.email,
      resetUrl, // In production, don't log this
    });

    // TODO: Send email with resetUrl
    // await sendEmail({
    //   to: user.email,
    //   subject: "Password Reset Request",
    //   html: `Click here to reset your password: ${resetUrl}`
    // });

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
      // In development, return the URL for testing
      ...(process.env.NODE_ENV === "development" && { resetUrl }),
    });
  } catch (error) {
    logger.error("Forgot password error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to process password reset request" },
      { status: 500 },
    );
  }
}
