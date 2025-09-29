import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import { sanitizeAndValidate } from "@/lib/validation";
import { serverLogger as logger } from "@/lib/logger";
import crypto from "crypto";

// Validation schema for payment verification
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Razorpay order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay signature is required"),
  bookingId: z.string().min(1, "Booking ID is required"),
});

export const dynamic = "force-dynamic";

async function verifyPaymentHandler(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const bodyData = rawBody ? JSON.parse(rawBody) : {};

    const validation = sanitizeAndValidate(verifyPaymentSchema, bodyData);
    if (!validation.success) {
      throw new ValidationError(validation.error);
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = validation.data;

    const currentUser = (request as any).user;

    logger.info("Starting payment verification", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      bookingId,
      customerId: currentUser.id,
    });

    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      logger.warn("Payment signature verification failed", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        customerId: currentUser.id,
      });
      throw new ValidationError("Invalid payment signature");
    }

    await connectDB();
    const Order = (await import("../../../../models/Order")).default;
    const Booking = (await import("../../../../models/Booking")).default;

    // Find the order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Verify user ownership
    if (order.customerId !== currentUser.id) {
      throw new ValidationError(
        "You can only verify payments for your own orders",
      );
    }

    // Check if payment is already verified
    if (order.status === "paid") {
      logger.warn("Duplicate payment verification attempt", {
        orderId: order._id,
        customerId: currentUser.id,
      });

      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        order: order.toSafeObject(),
      });
    }

    // Update order status
    await Order.findByIdAndUpdate(order._id, {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "paid",
      paymentMethod: "razorpay",
    });

    // Update booking status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: "paid",
        status: "confirmed",
        paymentMethod: "razorpay",
      },
      { new: true },
    );

    if (!booking) {
      // Rollback order status if booking update fails
      await Order.findByIdAndUpdate(order._id, {
        status: "failed",
        failureReason: "Booking not found during verification",
      });
      throw new NotFoundError("Booking not found");
    }

    logger.info("Payment verified successfully", {
      orderId: order._id,
      bookingId,
      paymentId: razorpay_payment_id,
      customerId: currentUser.id,
      amount: order.amount,
    });

    // TODO: Send confirmation email/SMS to customer
    // TODO: Send notification to vendor
    // TODO: Update vendor earnings

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        datetime: booking.datetime,
      },
      order: order.toSafeObject(),
    });
  } catch (error) {
    logger.error("Payment verification failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (request as any).user?.id,
      paymentId: (request as any).razorpay_payment_id,
    });

    if (error instanceof ValidationError || error instanceof NotFoundError) {
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
        error: "Payment verification failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const POST = requirePermission(
  PERMISSIONS.CREATE_BOOKINGS,
  verifyPaymentHandler,
);
