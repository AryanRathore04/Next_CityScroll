import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/middleware";
import { validateInput, sanitizeObject } from "@/lib/validation";
import { z } from "zod";
import { serverLogger as logger } from "@/lib/logger";
import { NotificationService } from "@/lib/notification-service";
import type { IService } from "../../../models/Service";
import type { IUser } from "../../../models/User";
import type { IBooking } from "../../../models/Booking";

// Enhanced booking schema with staff support
const enhancedBookingSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  vendorId: z.string().min(1, "Vendor ID is required"),
  datetime: z.string().datetime("Invalid datetime format"),
  notes: z.string().max(500).optional(),
  staffId: z.string().optional(), // Staff member ID (optional)
  staffPreference: z.enum(["any", "specific"]).default("any"), // Staff preference
});

type LeanService = Partial<IService> & { vendor?: Partial<IUser> | string };

export const dynamic = "force-dynamic";

async function createBookingHandler(request: NextRequest) {
  try {
    const raw = await request.text();
    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const sanitized = sanitizeObject(body);
    const validation = validateInput(enhancedBookingSchema, sanitized);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", message: validation.error },
        { status: 400 },
      );
    }

    const { serviceId, vendorId, datetime, notes, staffId, staffPreference } =
      validation.data;

    // Authenticated user must be the customer
    const currentUser = (request as unknown as { user?: { id: string } }).user;
    if (!currentUser)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );

    await connectDB();
    const Service = (await import("../../../models/Service")).default;
    const Booking = (await import("../../../models/Booking")).default;
    const User = (await import("../../../models/User")).default;
    const Staff = (await import("../../../models/Staff")).default;

    // Verify service exists
    const service = (await Service.findById(serviceId)
      .populate("vendor")
      .lean()) as LeanService | null;
    if (!service)
      return NextResponse.json({ error: "Service not found" }, { status: 404 });

    // Verify vendor exists and matches
    const vendor = (await User.findById(
      vendorId,
    ).lean()) as Partial<IUser> | null;
    if (!vendor)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    const serviceVendorId =
      (service.vendorId as unknown as string) ||
      (typeof service.vendor === "string"
        ? service.vendor
        : (service.vendor as Partial<IUser> | undefined)?._id ||
          (service.vendor as Partial<IUser> | undefined)?.toString());

    if (String(serviceVendorId) !== String(vendorId)) {
      return NextResponse.json(
        { error: "Service does not belong to vendor" },
        { status: 400 },
      );
    }

    // Verify staff if specified
    let assignedStaff = null;
    if (staffId) {
      assignedStaff = await Staff.findById(staffId);
      if (!assignedStaff) {
        return NextResponse.json(
          { error: "Staff member not found" },
          { status: 404 },
        );
      }

      // Verify staff belongs to vendor
      if (String(assignedStaff.vendorId) !== String(vendorId)) {
        return NextResponse.json(
          { error: "Staff member does not belong to this vendor" },
          { status: 400 },
        );
      }

      // Verify staff can perform this service
      if (assignedStaff.serviceIds && assignedStaff.serviceIds.length > 0) {
        const canPerformService = assignedStaff.serviceIds.some(
          (sId: any) => String(sId) === String(serviceId),
        );
        if (!canPerformService) {
          return NextResponse.json(
            { error: "Staff member cannot perform this service" },
            { status: 400 },
          );
        }
      }

      // Check staff availability for the requested datetime
      const bookingDate = new Date(datetime);
      if (!assignedStaff.isAvailableOnDate(bookingDate)) {
        return NextResponse.json(
          { error: "Staff member is not available on this date" },
          { status: 400 },
        );
      }

      // Check for conflicting bookings
      const serviceDuration = service.duration || 60;
      const endTime = new Date(bookingDate.getTime() + serviceDuration * 60000);

      const conflictingBooking = await Booking.findOne({
        staffId: assignedStaff._id,
        status: { $in: ["pending", "confirmed"] },
        $or: [
          {
            datetime: { $lte: bookingDate },
            $expr: {
              $gte: [
                { $add: ["$datetime", { $multiply: ["$duration", 60000] }] },
                bookingDate,
              ],
            },
          },
          {
            datetime: { $gte: bookingDate, $lt: endTime },
          },
        ],
      });

      if (conflictingBooking) {
        return NextResponse.json(
          { error: "Staff member is not available at this time" },
          { status: 400 },
        );
      }
    }

    // Create booking
    const totalPrice = typeof service.price === "number" ? service.price : 0;
    const serviceDuration = service.duration || 60;

    const booking = await Booking.create({
      customerId: currentUser.id,
      vendorId,
      serviceId,
      staffId: assignedStaff?._id || undefined,
      staffPreference,
      duration: serviceDuration,
      datetime: new Date(datetime),
      status: "pending",
      totalPrice,
      notes: notes || undefined,
      paymentStatus: "pending",
      reminderSent: false,
    } as Partial<IBooking>);

    logger.info("Booking created", {
      bookingId: booking._id,
      customerId: currentUser.id,
      vendorId,
      serviceId,
      staffId: assignedStaff?._id,
      datetime,
      totalPrice,
    });

    // Send booking confirmation notifications
    try {
      await NotificationService.sendBookingConfirmation(booking._id.toString());
    } catch (notificationError) {
      logger.error("Failed to send booking confirmation notifications", {
        bookingId: booking._id,
        error:
          notificationError instanceof Error
            ? notificationError.message
            : String(notificationError),
      });
      // Don't fail the booking creation if notifications fail
    }

    return NextResponse.json(
      { id: booking._id.toString(), success: true },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Create booking error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}

export const POST = requireAuth(createBookingHandler as any);
