import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";

export const dynamic = "force-dynamic";

async function getBookingByIdHandler(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const bookingId = params.id;

    // Authenticated user
    const currentUser = (
      request as unknown as { user?: { id: string; userType: string } }
    ).user;
    if (!currentUser) {
      return NextResponse.json(
        {
          error: "Authentication required",
          code: "UNAUTHORIZED",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      logger.error("Database connection failed", { error: dbError });
      return NextResponse.json(
        {
          error: "Service temporarily unavailable",
          code: "DATABASE_CONNECTION_ERROR",
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    const Booking = (await import("../../../../models/Booking")).default;

    // Fetch booking with populated fields
    const booking: any = await Booking.findById(bookingId)
      .populate("serviceId", "name price duration description")
      .populate("vendorId", "businessName businessAddress phone email")
      .populate("customerId", "firstName lastName email phone")
      .populate("staffId", "name email phone specialties")
      .lean();

    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
          code: "BOOKING_NOT_FOUND",
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      );
    }

    // Authorization check - user must be the customer or vendor of this booking
    const bookingCustomerId =
      (booking.customerId as any)?._id?.toString() ||
      (booking.customerId as any)?.toString();
    const bookingVendorId =
      (booking.vendorId as any)?._id?.toString() ||
      (booking.vendorId as any)?.toString();

    const isAuthorized =
      bookingCustomerId === currentUser.id ||
      bookingVendorId === currentUser.id ||
      currentUser.userType === "admin";

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: "Access denied",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        },
        { status: 403 },
      );
    }

    // Format response for booking-success page
    const service = booking.serviceId as any;
    const vendor = booking.vendorId as any;
    const customer = booking.customerId as any;
    const staff = booking.staffId as any;

    const formattedBooking = {
      id: booking._id.toString(),
      serviceName: service?.name || "Service",
      servicePrice: service?.price || booking.totalPrice,
      serviceDuration: service?.duration || booking.duration,
      serviceDescription: service?.description,
      vendorName: vendor?.businessName || "Vendor",
      vendorAddress: vendor?.businessAddress?.street
        ? `${vendor.businessAddress.street}, ${vendor.businessAddress.city}, ${vendor.businessAddress.state}`
        : vendor?.businessAddress?.city || "Location",
      vendorPhone: vendor?.phone,
      vendorEmail: vendor?.email,
      customerName: customer
        ? `${customer.firstName} ${customer.lastName}`
        : "Customer",
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      staffName: staff?.name,
      staffPhone: staff?.phone,
      datetime: booking.datetime,
      status: booking.status,
      totalPrice: booking.totalPrice,
      notes: booking.notes,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
    };

    logger.info("Booking fetched successfully", {
      bookingId,
      userId: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      booking: formattedBooking,
    });
  } catch (error) {
    logger.error("Fetch booking error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch booking",
        code: "BOOKING_FETCH_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const GET = requireAuth(getBookingByIdHandler as any);

/**
 * PATCH /api/bookings/[id]
 * Cancel a booking and initiate refund if payment was made
 */
async function cancelBookingHandler(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const bookingId = params.id;

    // Authenticated user
    const currentUser = (
      request as unknown as { user?: { id: string; userType: string } }
    ).user;
    if (!currentUser) {
      return NextResponse.json(
        {
          error: "Authentication required",
          code: "UNAUTHORIZED",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      logger.error("Database connection failed during cancellation", {
        error: dbError,
      });
      return NextResponse.json(
        {
          error: "Service temporarily unavailable",
          code: "DATABASE_CONNECTION_ERROR",
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    const Booking = (await import("../../../../models/Booking")).default;

    // Fetch booking
    const booking: any = await Booking.findById(bookingId)
      .populate("vendorId", "businessName email")
      .populate("customerId", "firstName lastName email");

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Authorization check - only customer can cancel their booking
    const bookingCustomerId =
      (booking.customerId as any)?._id?.toString() ||
      (booking.customerId as any)?.toString();

    if (bookingCustomerId !== currentUser.id) {
      logger.warn("Unauthorized cancellation attempt", {
        bookingId,
        userId: currentUser.id,
        bookingCustomerId,
      });
      return NextResponse.json(
        {
          error: "You can only cancel your own bookings",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        },
        { status: 403 },
      );
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      throw new ConflictError("Booking is already cancelled");
    }

    if (booking.status === "completed") {
      throw new ConflictError("Cannot cancel completed booking");
    }

    if (booking.status === "no_show") {
      throw new ConflictError("Cannot cancel no-show booking");
    }

    // Check cancellation policy - cannot cancel within 2 hours of booking time
    const bookingDateTime = new Date(booking.datetime);
    const now = new Date();
    const hoursUntilBooking =
      (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 2) {
      throw new ValidationError(
        "Cannot cancel bookings within 2 hours of scheduled time. Please contact the vendor directly.",
      );
    }

    // Update booking status to cancelled
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = currentUser.id;
    booking.updatedAt = new Date();
    await booking.save();

    logger.info("Booking cancelled", {
      bookingId,
      customerId: currentUser.id,
      vendorId: booking.vendorId,
      hoursUntilBooking,
    });

    // Handle refund if booking was paid
    let refundStatus = "not_applicable";
    if (booking.paymentStatus === "paid") {
      try {
        // Create refund record
        const Order = (await import("../../../../models/Order")).default;
        const order = await Order.findOne({ bookingId: booking._id });

        if (order && order.razorpayPaymentId) {
          // Update booking payment status to refund_pending
          booking.paymentStatus = "refund_pending";
          await booking.save();

          // TODO: Integrate with Razorpay refund API
          // For now, mark refund as pending and admin will process manually
          logger.info("Refund initiated for cancelled booking", {
            bookingId,
            orderId: order._id,
            amount: booking.totalPrice,
            razorpayPaymentId: order.razorpayPaymentId,
          });

          refundStatus = "refund_pending";
        }
      } catch (refundError) {
        logger.error("Failed to initiate refund", {
          error:
            refundError instanceof Error
              ? refundError.message
              : String(refundError),
          bookingId,
        });
        // Don't fail cancellation if refund fails - booking is still cancelled
        refundStatus = "refund_failed";
      }
    }

    // Send cancellation notification to vendor
    // TODO: Implement sendBookingCancellation method in NotificationService
    try {
      const { NotificationService } = await import(
        "../../../../lib/notification-service"
      );
      // await NotificationService.sendBookingCancellation(bookingId, currentUser.id);
      logger.info(
        "Cancellation notification skipped - method not implemented",
        {
          bookingId,
        },
      );
    } catch (notificationError) {
      logger.error("Failed to send cancellation notification", {
        error:
          notificationError instanceof Error
            ? notificationError.message
            : String(notificationError),
        bookingId,
      });
      // Don't fail cancellation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: {
        id: booking._id.toString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        refundStatus,
      },
    });
  } catch (error) {
    logger.error("Cancel booking error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      bookingId: params.id,
      userId: (
        request as unknown as { user?: { id: string; userType: string } }
      ).user?.id,
    });

    if (
      error instanceof NotFoundError ||
      error instanceof ValidationError ||
      error instanceof ConflictError
    ) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.constructor.name.replace("Error", "").toUpperCase(),
          timestamp: new Date().toISOString(),
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to cancel booking",
        code: "BOOKING_CANCEL_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const PATCH = requireAuth(cancelBookingHandler as any);
