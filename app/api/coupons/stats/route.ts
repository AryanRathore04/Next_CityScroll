import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/lib/coupon-service";
import { serverLogger as logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

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
