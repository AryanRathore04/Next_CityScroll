import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { serverLogger as logger } from "@/lib/logger";
import { requireAuth } from "@/lib/middleware/auth";

export const dynamic = "force-dynamic";

async function getVendorBookingsHandler(request: NextRequest) {
  const currentUser = (request as any).user;

  // Verify user is a vendor
  if (!currentUser || currentUser.userType !== "vendor") {
    logger.warn("Non-vendor attempted to access vendor bookings", {
      userId: currentUser?.id,
      userType: currentUser?.userType,
    });
    return NextResponse.json(
      { error: "Only vendors can access this endpoint" },
      { status: 403 },
    );
  }

  // Use authenticated user's ID instead of query parameter to prevent unauthorized access
  const vendorId = currentUser.id;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  // Handle test scenarios (only in development)
  if (
    process.env.NODE_ENV === "development" &&
    (vendorId === "test" || vendorId.startsWith("test-"))
  ) {
    const testBookings = [
      {
        id: "booking-1",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+91 9876543210",
        serviceName: "Relaxing Massage",
        servicePrice: 2500,
        bookingDate: new Date(),
        bookingTime: "14:00",
        status: "pending",
        vendorId: vendorId,
        createdAt: new Date().toISOString(),
      },
      {
        id: "booking-2",
        customerName: "Jane Smith",
        customerEmail: "jane@example.com",
        customerPhone: "+91 9876543211",
        serviceName: "Facial Treatment",
        servicePrice: 1800,
        bookingDate: new Date(),
        bookingTime: "16:00",
        status: "confirmed",
        vendorId: vendorId,
        createdAt: new Date().toISOString(),
      },
    ];

    let filteredBookings = testBookings;
    if (status) {
      filteredBookings = testBookings.filter((b: any) => b.status === status);
    }

    return NextResponse.json(filteredBookings);
  }

  try {
    await connectDB();
    const Booking = (await import("../../../../models/Booking")).default;

    // Build query filter - use vendorId from authenticated user
    const filter: any = { vendorId: vendorId };
    if (status) {
      filter.status = status;
    }

    logger.info("Fetching vendor bookings", {
      vendorId,
      status: status || "all",
    });

    const bookings = await Booking.find(filter)
      .populate("customerId", "firstName lastName email phone")
      .populate("serviceId", "name price category duration")
      .sort({ datetime: 1 }); // Sort by booking datetime ascending (upcoming first)

    const formattedBookings = bookings.map((booking: any) => {
      // Extract date and time from datetime field
      const bookingDateTime = new Date(booking.datetime);
      const bookingDate = bookingDateTime.toISOString().split("T")[0]; // YYYY-MM-DD
      const bookingTime = bookingDateTime.toTimeString().slice(0, 5); // HH:MM

      return {
        id: booking._id.toString(),
        customerName: `${booking.customerId.firstName} ${booking.customerId.lastName}`,
        customerEmail: booking.customerId.email,
        customerPhone: booking.customerId.phone,
        serviceName: booking.serviceId.name,
        servicePrice: booking.serviceId.price,
        bookingDate: bookingDate,
        bookingTime: bookingTime,
        datetime: booking.datetime, // Include original datetime for reference
        status: booking.status,
        vendorId: booking.vendorId.toString(),
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    });

    return NextResponse.json(formattedBookings);
  } catch (error) {
    logger.error("Vendor bookings fetch error:", {
      error: error instanceof Error ? error.message : String(error),
      vendorId: (request as any).user?.id,
    });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export const GET = requireAuth(getVendorBookingsHandler);

async function updateBookingStatusHandler(request: NextRequest) {
  const currentUser = (request as any).user;

  // Verify user is a vendor
  if (!currentUser || currentUser.userType !== "vendor") {
    return NextResponse.json(
      { error: "Only vendors can update booking status" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { id, status } = body || {};

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 },
      );
    }

    // Validate status transitions
    const validStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "no_show",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    await connectDB();
    const Booking = (await import("../../../../models/Booking")).default;

    // Find booking and verify it belongs to this vendor
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.vendorId.toString() !== currentUser.id) {
      logger.warn("Vendor attempted to update another vendor's booking", {
        vendorId: currentUser.id,
        bookingId: id,
        bookingVendorId: booking.vendorId.toString(),
      });
      return NextResponse.json(
        { error: "You can only update your own bookings" },
        { status: 403 },
      );
    }

    // Enforce status workflow
    const currentStatus = booking.status;
    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled", "no_show"],
      completed: [], // Final state
      cancelled: [], // Final state
      no_show: [], // Final state
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 },
      );
    }

    // Update booking
    await Booking.findByIdAndUpdate(id, {
      status,
      updatedAt: new Date(),
    });

    logger.info("Booking status updated", {
      bookingId: id,
      vendorId: currentUser.id,
      oldStatus: currentStatus,
      newStatus: status,
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    logger.error("Update booking error:", {
      error: error instanceof Error ? error.message : String(error),
      vendorId: (request as any).user?.id,
    });
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}

export const PUT = requireAuth(updateBookingStatusHandler);
