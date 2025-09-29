import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/lib/coupon-service";
import { serverLogger as logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, customerId, bookingDetails } = body;

    if (!couponCode || !customerId || !bookingDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Coupon code, customer ID, and booking details are required",
        },
        { status: 400 },
      );
    }

    const result = await CouponService.validateCoupon(
      couponCode,
      customerId,
      bookingDetails,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error validating coupon", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate coupon",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, customerId, bookingId, discountAmount } = body;

    if (
      !couponCode ||
      !customerId ||
      !bookingId ||
      discountAmount === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await CouponService.applyCoupon(
      couponCode,
      customerId,
      bookingId,
      discountAmount,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error applying coupon", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to apply coupon",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
