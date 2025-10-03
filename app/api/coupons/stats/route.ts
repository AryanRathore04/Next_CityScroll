import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/lib/coupon-service";
import { serverLogger as logger } from "@/lib/logger";
import { requireAuth } from "@/lib/middleware";

async function getCouponStatsHandler(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = (
      request as unknown as { user?: { id: string; userType: string } }
    ).user;
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get("vendorId") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    // If user is a vendor, only allow them to see their own stats
    if (currentUser.userType === "vendor") {
      vendorId = currentUser.id;
    } else if (currentUser.userType !== "admin" && vendorId) {
      // Non-admin users can't query other vendors' stats
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const stats = await CouponService.getCouponStats(
      vendorId,
      startDate,
      endDate,
    );

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error getting coupon stats", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get coupon statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = requireAuth(getCouponStatsHandler as any);
