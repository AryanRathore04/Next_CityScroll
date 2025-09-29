import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";
import { z } from "zod";
import { sanitizeAndValidate } from "@/lib/validation";
import { serverLogger as logger } from "@/lib/logger";

// Validation schema for create order
const createOrderSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

export const dynamic = "force-dynamic";

async function createOrderHandler(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const bodyData = rawBody ? JSON.parse(rawBody) : {};

    const validation = sanitizeAndValidate(createOrderSchema, bodyData);
    if (!validation.success) {
      throw new ValidationError(validation.error);
    }

    const { bookingId } = validation.data;
    const currentUser = (request as any).user;

    await connectDB();
    const Booking = (await import("../../../../models/Booking")).default;
    const Order = (await import("../../../../models/Order")).default;
    const User = (await import("../../../../models/User")).default;

    // Get booking with populated service info
    const booking = await Booking.findById(bookingId)
      .populate("service", "name price duration")
      .populate("vendor", "businessName")
      .populate("customer", "firstName lastName email");

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Verify the current user is the customer for this booking
    if (booking.customerId !== currentUser.id) {
      throw new ValidationError("You can only pay for your own bookings");
    }

    // Check if booking is in a payable state
    if (booking.paymentStatus === "paid") {
      throw new ConflictError("This booking is already paid for");
    }

    if (booking.status === "cancelled") {
      throw new ConflictError("Cannot pay for cancelled booking");
    }

    // Check if an order already exists for this booking
    const existingOrder = await Order.findOne({ bookingId });
    if (existingOrder && existingOrder.status === "paid") {
      throw new ConflictError("Payment already completed for this booking");
    }

    // Calculate total amount (booking amount + any platform fees)
    const baseAmount = booking.totalPrice;
    const platformFeeRate = 0.02; // 2% platform fee
    const platformFee = Math.round(baseAmount * platformFeeRate);
    const totalAmount = baseAmount + platformFee;

    logger.info("Creating Razorpay order", {
      bookingId,
      customerId: currentUser.id,
      baseAmount,
      platformFee,
      totalAmount,
    });

    // Initialize Razorpay inside the handler to avoid constructing it at module
    // load time (Next.js build can execute server code during page data
    // collection). Use a dynamic require to avoid bundlers pulling it into
    // non-server bundles.
    let Razorpay: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      Razorpay = eval("require")("razorpay");
    } catch (err) {
      logger.error("Razorpay package not available", { error: String(err) });
      return NextResponse.json(
        { error: "Payment gateway unavailable" },
        { status: 503 },
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      logger.error("Razorpay credentials are missing");
      return NextResponse.json(
        { error: "Payment gateway misconfigured" },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Amount in paise
      currency: "INR",
      receipt: `booking_${bookingId}_${Date.now()}`,
      notes: {
        bookingId,
        customerId: booking.customerId,
        vendorId: booking.vendorId,
        serviceName: booking.service.name,
        bookingDate: booking.datetime.toISOString(),
      },
    });

    // Delete any existing pending order for this booking
    if (existingOrder && existingOrder.status === "created") {
      await Order.findByIdAndDelete(existingOrder._id);
    }

    // Save order to database
    const order = await Order.create({
      bookingId,
      customerId: booking.customerId,
      vendorId: booking.vendorId,
      amount: totalAmount,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
      status: "created",
    });

    logger.info("Razorpay order created successfully", {
      orderId: razorpayOrder.id,
      bookingId,
      customerId: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      bookingDetails: {
        serviceName: booking.service.name,
        vendorName: booking.vendor.businessName,
        datetime: booking.datetime,
        baseAmount,
        platformFee,
        totalAmount,
      },
    });
  } catch (error) {
    logger.error("Payment order creation failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (request as any).user?.id,
    });

    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError
    ) {
      return NextResponse.json(
        {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create payment order",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const POST = requirePermission(
  PERMISSIONS.CREATE_BOOKINGS,
  createOrderHandler,
);
