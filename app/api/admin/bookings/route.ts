import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/middleware";
import { connectDB } from "@/lib/mongodb";
import { PERMISSIONS } from "@/lib/permissions";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Service from "@/models/Service";

export const dynamic = "force-dynamic";

async function getRecentBookingsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    await connectDB();

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fetch related data
    const customerIds = [...new Set(bookings.map((b) => b.customerId))];
    const vendorIds = [...new Set(bookings.map((b) => b.vendorId))];
    const serviceIds = [...new Set(bookings.map((b) => b.serviceId))];

    const [customers, vendors, services] = await Promise.all([
      User.find({ _id: { $in: customerIds } })
        .select("firstName lastName email")
        .lean(),
      User.find({ _id: { $in: vendorIds } })
        .select("businessName email")
        .lean(),
      Service.find({ _id: { $in: serviceIds } })
        .select("name price")
        .lean(),
    ]);

    const customerMap = new Map(
      customers.map((c: any) => [c._id.toString(), c]),
    );
    const vendorMap = new Map(vendors.map((v: any) => [v._id.toString(), v]));
    const serviceMap = new Map(services.map((s: any) => [s._id.toString(), s]));

    const formattedBookings = bookings.map((booking: any) => {
      const customer = customerMap.get(booking.customerId.toString());
      const vendor = vendorMap.get(booking.vendorId.toString());
      const service = serviceMap.get(booking.serviceId.toString());

      return {
        id: booking._id.toString(),
        customer: customer
          ? `${customer.firstName} ${customer.lastName}`
          : "Unknown",
        customerEmail: customer?.email,
        vendor: vendor?.businessName || "Unknown",
        vendorEmail: vendor?.email,
        service: service?.name || "Unknown",
        amount: `₹${booking.totalPrice.toLocaleString()}`,
        rawAmount: booking.totalPrice,
        status: booking.status,
        date: booking.datetime,
        createdAt: booking.createdAt,
        paymentStatus: booking.paymentStatus,
      };
    });

    // Filter by search if provided
    let filteredBookings = formattedBookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = formattedBookings.filter(
        (b: any) =>
          b.id.toLowerCase().includes(searchLower) ||
          b.customer.toLowerCase().includes(searchLower) ||
          b.vendor.toLowerCase().includes(searchLower) ||
          b.service.toLowerCase().includes(searchLower),
      );
    }

    return NextResponse.json(
      {
        success: true,
        bookings: filteredBookings,
        total: filteredBookings.length,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, max-age=0",
        },
      },
    );
  } catch (error: any) {
    console.error("❌ [ADMIN BOOKINGS API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings", message: error.message },
      { status: 500 },
    );
  }
}

export const GET = requirePermission(
  PERMISSIONS.VIEW_ALL_ANALYTICS,
  getRecentBookingsHandler,
);
