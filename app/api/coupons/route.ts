import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/lib/coupon-service";
import { serverLogger as logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponData, createdBy } = body;

    if (!couponData || !createdBy) {
      return NextResponse.json(
        { success: false, error: "Coupon data and creator ID are required" },
        { status: 400 },
      );
    }

    const result = await CouponService.createCoupon(couponData, createdBy);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.coupon,
    });
  } catch (error) {
    logger.error("Error creating coupon", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create coupon",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const vendorId = searchParams.get("vendorId") || undefined;
    const serviceCategory = searchParams.get("serviceCategory") || undefined;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 },
      );
    }

    const coupons = await CouponService.getAvailableCoupons(
      customerId,
      vendorId,
      serviceCategory,
    );

    return NextResponse.json({
      success: true,
      data: { coupons },
    });
  } catch (error) {
    logger.error("Error getting available coupons", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get available coupons",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
