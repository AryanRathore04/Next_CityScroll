import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/lib/coupon-service";
import { serverLogger as logger } from "@/lib/logger";
import { requireAuth } from "@/lib/middleware";

async function validateCouponHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, bookingDetails } = body;

    // Get customerId from authenticated user, NOT from request body
    const currentUser = (request as any).user;
    const customerId = currentUser.id;

    if (!couponCode || !bookingDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Coupon code and booking details are required",
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

async function applyCouponHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, bookingId, discountAmount } = body;

    // Get customerId from authenticated user, NOT from request body
    const currentUser = (request as any).user;
    const customerId = currentUser.id;

    if (!couponCode || !bookingId || discountAmount === undefined) {
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

// Export with authentication requirement
export const POST = requireAuth(validateCouponHandler);
export const PUT = requireAuth(applyCouponHandler);
