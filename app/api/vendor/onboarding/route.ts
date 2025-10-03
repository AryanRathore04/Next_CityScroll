import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// POST /api/vendor/onboarding - Mark onboarding as complete
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    if (user.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Only vendors can complete onboarding" },
        { status: 403 },
      );
    }

    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Update user's onboarding status
    await User.findByIdAndUpdate(user.id, {
      onboardingCompleted: true,
      updatedAt: new Date(),
    });

    logger.info("Vendor onboarding completed", {
      vendorId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    logger.error("Error completing onboarding", { error });
    return NextResponse.json(
      { success: false, error: "Failed to complete onboarding" },
      { status: 500 },
    );
  }
}

// GET /api/vendor/onboarding - Check onboarding status
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    if (user.userType !== "vendor") {
      return NextResponse.json({ success: false, onboardingCompleted: true });
    }

    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    const vendor = await User.findById(user.id).select("onboardingCompleted");

    return NextResponse.json({
      success: true,
      onboardingCompleted: vendor?.onboardingCompleted || false,
    });
  } catch (error) {
    logger.error("Error checking onboarding status", { error });
    return NextResponse.json(
      { success: false, error: "Failed to check onboarding status" },
      { status: 500 },
    );
  }
}
