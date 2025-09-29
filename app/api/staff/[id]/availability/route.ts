import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/staff/[id]/availability - Check staff availability
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const Staff = (await import("../../../../../models/Staff")).default;
    const Booking = (await import("../../../../../models/Booking")).default;

    const staff = await Staff.findById(params.id);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const serviceDuration = parseInt(searchParams.get("duration") || "60");

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: "Date parameter is required" },
        { status: 400 },
      );
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format" },
        { status: 400 },
      );
    }

    // Get available time slots for the specified date
    const availableSlots = staff.getAvailableTimeSlots(date, serviceDuration);

    // Get existing bookings for that date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      staffId: staff._id,
      datetime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ["pending", "confirmed"] },
    }).select("datetime duration");

    // Filter out booked slots
    const bookedTimes = existingBookings.map((booking) => ({
      start: booking.datetime,
      end: new Date(
        booking.datetime.getTime() + (booking.duration || 60) * 60000,
      ),
    }));

    const availableTimeSlots = availableSlots.filter((slot: string) => {
      const slotStart = new Date(`${dateParam}T${slot}:00`);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      return !bookedTimes.some(
        (booked) =>
          (slotStart >= booked.start && slotStart < booked.end) ||
          (slotEnd > booked.start && slotEnd <= booked.end) ||
          (slotStart <= booked.start && slotEnd >= booked.end),
      );
    });

    logger.info("Staff availability checked", {
      staffId: staff._id,
      date: dateParam,
      availableSlots: availableTimeSlots.length,
      requestedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        staffId: staff._id,
        staffName: staff.name,
        date: dateParam,
        availableSlots: availableTimeSlots,
        isAvailable: staff.isAvailableOnDate(date),
        schedule: staff.schedule,
      },
    });
  } catch (error) {
    const params = await context.params;
    logger.error("Error checking staff availability", {
      error,
      staffId: params.id,
    });

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
