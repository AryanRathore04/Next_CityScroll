import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { NotificationService } from "@/lib/notification-service";
import { serverLogger as logger } from "@/lib/logger";
import { addDays, startOfDay, endOfDay } from "date-fns";

// POST /api/cron/reminders - Send booking reminders (24 hours before)
export async function POST(request: NextRequest) {
  try {
    // Verify cron key for security
    const authHeader = request.headers.get("authorization");
    const cronKey = authHeader?.replace("Bearer ", "");

    if (cronKey !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const Booking = (await import("../../../../models/Booking")).default;

    // Find bookings scheduled for tomorrow that haven't had reminders sent
    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = endOfDay(tomorrow);

    const bookingsNeedingReminders = await Booking.find({
      datetime: {
        $gte: startOfTomorrow,
        $lte: endOfTomorrow,
      },
      status: { $in: ["pending", "confirmed"] },
      reminderSent: { $ne: true },
    });

    logger.info(
      `Found ${bookingsNeedingReminders.length} bookings needing reminders for tomorrow`,
    );

    let successCount = 0;
    let errorCount = 0;

    // Send reminder for each booking
    for (const booking of bookingsNeedingReminders) {
      try {
        await NotificationService.sendBookingReminder(booking._id.toString());
        successCount++;

        logger.info("Booking reminder sent", {
          bookingId: booking._id,
          datetime: booking.datetime,
        });
      } catch (error) {
        errorCount++;
        logger.error("Failed to send booking reminder", {
          bookingId: booking._id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalBookings: bookingsNeedingReminders.length,
        successCount,
        errorCount,
        date: tomorrow.toISOString().split("T")[0],
      },
      message: `Processed ${bookingsNeedingReminders.length} booking reminders`,
    });
  } catch (error) {
    logger.error("Cron reminder job failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Reminder job failed" },
      { status: 500 },
    );
  }
}
