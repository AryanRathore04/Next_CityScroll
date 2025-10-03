import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { serverLogger as logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper function to convert 24h time to 12h format with AM/PM
function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Helper function to get day of week from date
function getDayOfWeek(date: Date): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

// Helper function to generate time slots
function generateTimeSlots(
  startTime: string,
  endTime: string,
  interval: number = 30,
  breaks: Array<{ startTime: string; endTime: string }> = [],
): string[] {
  const slots: string[] = [];

  // Convert time strings to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  let currentMinutes = startMinutes;

  while (currentMinutes < endMinutes) {
    const slotTime = minutesToTime(currentMinutes);

    // Check if this slot conflicts with breaks
    const conflictsWithBreak = breaks.some((breakTime) => {
      const breakStart = timeToMinutes(breakTime.startTime);
      const breakEnd = timeToMinutes(breakTime.endTime);
      return currentMinutes >= breakStart && currentMinutes < breakEnd;
    });

    if (!conflictsWithBreak) {
      slots.push(formatTimeTo12Hour(slotTime));
    }

    currentMinutes += interval;
  }

  return slots;
}

// GET /api/vendor/[id]/availability - Get vendor business hours and available time slots
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const vendorId = params.id;

    await connectDB();

    const Staff = (await import("../../../../../models/Staff")).default;
    const Booking = (await import("../../../../../models/Booking")).default;
    const User = (await import("../../../../../models/User")).default;

    // Check if vendor exists
    const vendor = await User.findById(vendorId).select(
      "businessName userType",
    );
    if (!vendor || vendor.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Default to today if no date specified
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const dayOfWeek = getDayOfWeek(targetDate);

    // Get all active staff for this vendor
    const staffMembers = await Staff.find({
      vendorId,
      isActive: true,
    });

    if (staffMembers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          vendorId,
          date: targetDate.toISOString().split("T")[0],
          dayOfWeek,
          isOpen: false,
          businessHours: null,
          availableSlots: [],
          message: "No staff members available",
        },
      });
    }

    // Check if any staff is available today
    const availableStaff = staffMembers.filter(
      (staff) =>
        staff.schedule[dayOfWeek as keyof typeof staff.schedule]?.isAvailable,
    );

    if (availableStaff.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          vendorId,
          date: targetDate.toISOString().split("T")[0],
          dayOfWeek,
          isOpen: false,
          businessHours: null,
          availableSlots: [],
          message: "Closed today",
        },
      });
    }

    // Get the earliest start time and latest end time from all available staff
    let earliestStart = "23:59";
    let latestEnd = "00:00";
    let allBreaks: Array<{ startTime: string; endTime: string }> = [];

    availableStaff.forEach((staff) => {
      const schedule = staff.schedule[dayOfWeek as keyof typeof staff.schedule];
      if (schedule && schedule.isAvailable) {
        if (schedule.startTime < earliestStart) {
          earliestStart = schedule.startTime;
        }
        if (schedule.endTime > latestEnd) {
          latestEnd = schedule.endTime;
        }
        if (schedule.breaks) {
          allBreaks.push(...schedule.breaks);
        }
      }
    });

    // Generate all time slots
    const allTimeSlots = generateTimeSlots(
      earliestStart,
      latestEnd,
      30,
      allBreaks,
    );

    // Get existing bookings for the date to filter out booked slots
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Booking.find({
      vendorId,
      datetime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ["pending", "confirmed"] },
    }).select("datetime duration");

    // Create set of booked times for quick lookup
    const bookedTimesSet = new Set(
      existingBookings.map((booking) => {
        const startTime = booking.datetime;
        return formatTimeTo12Hour(
          `${startTime.getHours().toString().padStart(2, "0")}:${startTime
            .getMinutes()
            .toString()
            .padStart(2, "0")}`,
        );
      }),
    );

    // Create slots array with availability status
    const timeSlots = allTimeSlots.map((slot) => ({
      time: slot,
      available: !bookedTimesSet.has(slot),
    }));

    // Get only available slots for backward compatibility
    const availableSlots = timeSlots
      .filter((slot) => slot.available)
      .map((slot) => slot.time);

    // Format business hours
    const businessHours = {
      open: formatTimeTo12Hour(earliestStart),
      close: formatTimeTo12Hour(latestEnd),
      display: `${formatTimeTo12Hour(earliestStart)} - ${formatTimeTo12Hour(
        latestEnd,
      )}`,
    };

    logger.info("Vendor availability fetched", {
      vendorId,
      date: targetDate.toISOString().split("T")[0],
      dayOfWeek,
      staffCount: availableStaff.length,
      totalSlots: timeSlots.length,
      availableSlots: availableSlots.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        date: targetDate.toISOString().split("T")[0],
        dayOfWeek,
        isOpen: true,
        businessHours,
        timeSlots, // All slots with availability status
        availableSlots, // Only available slots (for backward compatibility)
        totalSlots: timeSlots.length,
        bookedSlots: timeSlots.filter((slot) => !slot.available).length,
        staffCount: availableStaff.length,
      },
    });
  } catch (error) {
    const params = await context.params;
    logger.error("Error fetching vendor availability", {
      error,
      vendorId: params.id,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch availability",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
