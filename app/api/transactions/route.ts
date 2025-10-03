import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";

// Dynamic imports to avoid compilation issues
const getTransactionModels = async () => {
  const { Transaction, CommissionConfig, Payout } = await import(
    "@/models/Transaction"
  );
  return { Transaction, CommissionConfig, Payout };
};

// GET /api/transactions - Get transactions for user
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
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    await connectDB();
    const { Transaction } = await getTransactionModels();

    // Build query based on user role
    const query: any = {};

    if (user.userType === "vendor") {
      query.vendorId = user.id;
    } else if (user.userType === "customer") {
      query.customerId = user.id;
    } else if (user.userType === "admin") {
      // Admin can see all transactions
      if (url.searchParams.get("vendorId")) {
        query.vendorId = url.searchParams.get("vendorId");
      }
      if (url.searchParams.get("customerId")) {
        query.customerId = url.searchParams.get("customerId");
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Apply filters
    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("customerId", "firstName lastName email")
        .populate("vendorId", "businessName email")
        .populate("bookingId", "serviceId scheduledDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching transactions", {
      error: error instanceof Error ? error.message : String(error),
      userId: (request as any).user?.id,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/transactions - Create transaction (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.userType !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      type,
      bookingId,
      customerId,
      vendorId,
      amount,
      paymentMethod,
      description,
      metadata,
    } = body;

    // Validate required fields
    if (!type || !amount || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: type, amount, paymentMethod",
        },
        { status: 400 },
      );
    }

    await connectDB();
    const { Transaction } = await getTransactionModels();

    // Calculate commission (simplified - you'd use CommissionPayoutService here)
    const platformCommission = type === "booking_payment" ? amount * 0.1 : 0; // 10% default

    const transaction = new Transaction({
      type,
      bookingId,
      customerId,
      vendorId,
      amount,
      platformCommission,
      paymentMethod,
      description,
      metadata,
      createdBy: user.id,
      status: "completed",
    });

    await transaction.save();

    return NextResponse.json({
      success: true,
      data: { transaction },
      message: "Transaction created successfully",
    });
  } catch (error) {
    logger.error("Error creating transaction", {
      error: error instanceof Error ? error.message : String(error),
      userId: (request as any).user?.id,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
