import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");
  const status = searchParams.get("status");

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  }

  // Handle test scenarios
  if (vendorId === "test" || vendorId.startsWith("test-")) {
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

    // Build query filter
    const filter: any = { vendor: vendorId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate("customer", "firstName lastName email phone")
      .populate("service", "name price category duration")
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map((booking: any) => ({
      id: booking._id.toString(),
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      serviceName: booking.service.name,
      servicePrice: booking.service.price,
      bookingDate: booking.date,
      bookingTime: booking.time,
      status: booking.status,
      vendorId: booking.vendor.toString(),
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body || {};

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 },
      );
    }

    await connectDB();
    const Booking = (await import("../../../../models/Booking")).default;

    await Booking.findByIdAndUpdate(id, {
      status,
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}
