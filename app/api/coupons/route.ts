import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/lib/coupon-service";
import { serverLogger as logger } from "@/lib/logger";
import { requireAuth } from "@/lib/middleware";
import { validatePermission, PERMISSIONS } from "@/lib/permissions";

async function createCouponHandler(request: NextRequest) {
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

    // Validate vendor or admin permission
    if (currentUser.userType !== "vendor" && currentUser.userType !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Only vendors and admins can create coupons",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { couponData } = body;

    if (!couponData) {
      return NextResponse.json(
        { success: false, error: "Coupon data is required" },
        { status: 400 },
      );
    }

    // Use authenticated user ID as creator
    const result = await CouponService.createCoupon(couponData, currentUser.id);

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

async function getAvailableCouponsHandler(request: NextRequest) {
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
    const vendorId = searchParams.get("vendorId") || undefined;
    const serviceCategory = searchParams.get("serviceCategory") || undefined;

    // Use authenticated user ID as customer
    const coupons = await CouponService.getAvailableCoupons(
      currentUser.id,
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

export const POST = requireAuth(createCouponHandler as any);
export const GET = requireAuth(getAvailableCouponsHandler as any);
