import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";

// Dynamic imports to avoid compilation issues
const getPayoutModels = async () => {
  const { Payout } = await import("@/models/Transaction");
  return { Payout };
};

// GET /api/payouts - Get payouts for vendor
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");

    await connectDB();
    const { Payout } = await getPayoutModels();

    // Build query based on user role
    const query: any = {};

    if (user.userType === "vendor") {
      query.vendorId = user.id;
    } else if (user.userType === "admin") {
      // Admin can see all payouts
      if (url.searchParams.get("vendorId")) {
        query.vendorId = url.searchParams.get("vendorId");
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .populate("vendorId", "businessName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payout.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payouts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching payouts", {
      error: error instanceof Error ? error.message : String(error),
      userId: (request as any).user?.id,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/payouts - Create payout request
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Vendor access required." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { payoutMethod, accountDetails, notes } = body;

    // Validate required fields
    if (!payoutMethod || !accountDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: payoutMethod, accountDetails",
        },
        { status: 400 },
      );
    }

    // Use the commission service to create payout
    try {
      const { CommissionPayoutService } = await import(
        "@/lib/commission-payout-service"
      );

      const payout = await CommissionPayoutService.createPayout({
        vendorId: user.id,
        payoutMethod,
        accountDetails,
        notes,
      });

      return NextResponse.json({
        success: true,
        data: { payout },
        message: "Payout request created successfully",
      });
    } catch (serviceError: any) {
      return NextResponse.json(
        { success: false, error: serviceError.message },
        { status: 400 },
      );
    }
  } catch (error) {
    logger.error("Error creating payout", {
      error: error instanceof Error ? error.message : String(error),
      userId: (request as any).user?.id,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
