import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";

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
