import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/middleware";
import { validateInput, sanitizeObject } from "@/lib/validation";
import { z } from "zod";
import { serverLogger as logger } from "@/lib/logger";
import { NotificationService } from "@/lib/notification-service";
import mongoose from "mongoose";
import type { IService } from "../../../models/Service";
import type { IUser } from "../../../models/User";
import type { IBooking } from "../../../models/Booking";

// Enhanced booking schema with staff support
const enhancedBookingSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  datetime: z
    .string()
    .datetime("Invalid datetime format")
    .refine(
      (dateStr) => {
        const bookingDate = new Date(dateStr);
        const now = new Date();
        // Allow bookings that are at most 5 minutes in the past (to account for timezone/processing delays)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        return bookingDate > fiveMinutesAgo;
      },
      {
        message: "Booking datetime must be in the future",
      },
    ),
  notes: z.string().max(500).optional(),
  staffId: z.string().optional(), // Staff member ID (optional)
  staffPreference: z.enum(["any", "specific"]).default("any"), // Staff preference
});

type LeanService = Partial<IService> & { vendor?: Partial<IUser> | string };

export const dynamic = "force-dynamic";

async function getBookingsHandler(request: NextRequest) {
  try {
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

    const Booking = (await import("../../../models/Booking")).default;

    // Build query based on user type
    const query: any = {};
    if (currentUser.userType === "vendor") {
      query.vendorId = currentUser.id;
    } else {
      query.customerId = currentUser.id;
    }

    // Fetch bookings with populated fields
    const bookings = await Booking.find(query)
      .populate("serviceId", "name price duration")
      .populate("vendorId", "businessName businessAddress")
      .populate("customerId", "firstName lastName email")
      .populate("staffId", "name")
      .sort({ datetime: -1 })
      .lean();

    logger.info("Bookings fetched successfully", {
      userId: currentUser.id,
      userType: currentUser.userType,
      count: bookings.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        count: bookings.length,
      },
    });
  } catch (error) {
    logger.error("Fetch bookings error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        code: "BOOKINGS_FETCH_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

async function createBookingHandler(request: NextRequest) {
  let session: mongoose.ClientSession | null = null;

  try {
    const raw = await request.text();
    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body",
          code: "INVALID_JSON",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const sanitized = sanitizeObject(body);
    const validation = validateInput(enhancedBookingSchema, sanitized);
    if (!validation.success) {
      logger.warn("Validation failed", {
        error: validation.error,
        receivedData: Object.keys(sanitized),
        datetime: sanitized.datetime,
        now: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: "Invalid input",
          message: validation.error,
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const { serviceId, datetime, notes, staffId, staffPreference } =
      validation.data;

    logger.info("Creating booking", {
      serviceId,
      datetime,
      staffId,
      staffPreference,
      customerId: (request as unknown as { user?: { id: string } }).user?.id,
    });

    // Authenticated user must be the customer
    const currentUser = (request as unknown as { user?: { id: string } }).user;
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

    // Connect to database with error handling
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

    const Service = (await import("../../../models/Service")).default;
    const Booking = (await import("../../../models/Booking")).default;
    const User = (await import("../../../models/User")).default;
    const Staff = (await import("../../../models/Staff")).default;

    // Start MongoDB transaction for atomic operations
    session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify service exists and get vendor ID from service (not from client!)
      const service = (await Service.findById(serviceId)
        .populate("vendor")
        .session(session)
        .lean()) as LeanService | null;

      if (!service) {
        await session.abortTransaction();
        return NextResponse.json(
          {
            error: "Service not found",
            code: "SERVICE_NOT_FOUND",
            timestamp: new Date().toISOString(),
          },
          { status: 404 },
        );
      }

      // SECURITY: Derive vendorId from service, not from client request
      const serviceVendorId =
        (service.vendorId as unknown as string) ||
        (typeof service.vendor === "string"
          ? service.vendor
          : (service.vendor as Partial<IUser> | undefined)?._id?.toString() ||
            (service.vendor as Partial<IUser> | undefined)?.toString());

      if (!serviceVendorId) {
        await session.abortTransaction();
        return NextResponse.json(
          {
            error: "Service vendor information is missing",
            code: "INVALID_SERVICE_DATA",
            timestamp: new Date().toISOString(),
          },
          { status: 400 },
        );
      }

      const vendorId = serviceVendorId;

      // Verify vendor exists and is active
      const vendor = (await User.findById(vendorId)
        .select("-password")
        .session(session)
        .lean()) as Partial<IUser> | null;
      if (!vendor) {
        await session.abortTransaction();
        return NextResponse.json(
          {
            error: "Vendor not found",
            code: "VENDOR_NOT_FOUND",
            timestamp: new Date().toISOString(),
          },
          { status: 404 },
        );
      }

      logger.info("Vendor status check", {
        vendorId,
        vendorStatus: vendor.status,
        vendorUserType: vendor.userType,
        isActive: vendor.status === "active",
      });

      // Only reject if vendor is explicitly suspended or rejected
      // Allow bookings for vendors with status: active, approved, pending_approval, or undefined
      if (vendor.status === "suspended" || vendor.status === "rejected") {
        await session.abortTransaction();
        return NextResponse.json(
          {
            error: "Vendor is not currently accepting bookings",
            code: "VENDOR_INACTIVE",
            timestamp: new Date().toISOString(),
          },
          { status: 400 },
        );
      }

      // Handle staff assignment
      let assignedStaffId = staffId;
      let assignedStaff = null;

      if (staffId) {
        // Specific staff requested
        assignedStaff = await Staff.findById(staffId).session(session);
        if (!assignedStaff) {
          await session.abortTransaction();
          return NextResponse.json(
            {
              error: "Staff member not found",
              code: "STAFF_NOT_FOUND",
              timestamp: new Date().toISOString(),
            },
            { status: 404 },
          );
        }

        // Verify staff belongs to vendor
        if (String(assignedStaff.vendorId) !== String(vendorId)) {
          await session.abortTransaction();
          return NextResponse.json(
            {
              error: "Staff member does not belong to this vendor",
              code: "STAFF_VENDOR_MISMATCH",
              timestamp: new Date().toISOString(),
            },
            { status: 400 },
          );
        }

        // Verify staff can perform this service
        if (assignedStaff.services && assignedStaff.services.length > 0) {
          const canPerformService = assignedStaff.services.some(
            (sId: any) => String(sId) === String(serviceId),
          );
          if (!canPerformService) {
            await session.abortTransaction();
            return NextResponse.json(
              {
                error: "Staff member cannot perform this service",
                code: "STAFF_SERVICE_MISMATCH",
                timestamp: new Date().toISOString(),
              },
              { status: 400 },
            );
          }
        }
      } else if (staffPreference === "any") {
        // Auto-assign available staff
        const bookingDate = new Date(datetime);
        const serviceDuration = service.duration || 60;
        const endTime = new Date(
          bookingDate.getTime() + serviceDuration * 60000,
        );

        // Find available staff members who can perform this service
        const availableStaffMembers = await Staff.find({
          vendorId: vendorId,
          isActive: true,
          $or: [
            { services: { $size: 0 } }, // Staff with no specific services (can do all)
            { services: serviceId }, // Staff who can do this service
          ],
        }).session(session);

        logger.info("Searching for available staff", {
          vendorId,
          serviceId,
          bookingDate: datetime,
          foundStaffCount: availableStaffMembers.length,
        });

        for (const staffMember of availableStaffMembers) {
          // Check if staff is available on this date
          if (!staffMember.isAvailableOnDate(bookingDate)) {
            logger.info("Staff not available on date", {
              staffId: staffMember._id,
              staffName: `${staffMember.firstName} ${staffMember.lastName}`,
              date: bookingDate,
            });
            continue;
          }

          // Check for conflicting bookings (within transaction)
          const conflictingBooking = await Booking.findOne({
            staffId: staffMember._id,
            status: { $in: ["pending", "confirmed"] },
            $or: [
              {
                datetime: { $lte: bookingDate },
                $expr: {
                  $gte: [
                    {
                      $add: ["$datetime", { $multiply: ["$duration", 60000] }],
                    },
                    bookingDate,
                  ],
                },
              },
              {
                datetime: { $gte: bookingDate, $lt: endTime },
              },
            ],
          }).session(session);

          if (!conflictingBooking) {
            // Found available staff!
            assignedStaff = staffMember;
            assignedStaffId = staffMember._id.toString();
            logger.info("Auto-assigned staff member", {
              staffId: assignedStaffId,
              staffName: `${staffMember.firstName} ${staffMember.lastName}`,
              bookingTime: datetime,
            });
            break;
          } else {
            logger.info("Staff has conflicting booking", {
              staffId: staffMember._id,
              staffName: `${staffMember.firstName} ${staffMember.lastName}`,
              conflictingBookingId: conflictingBooking._id,
            });
          }
        }

        if (!assignedStaffId) {
          logger.warn("No staff available for booking", {
            vendorId,
            serviceId,
            datetime,
            totalStaffChecked: availableStaffMembers.length,
          });
          await session.abortTransaction();
          return NextResponse.json(
            {
              error: "No staff members available at this time",
              code: "NO_STAFF_AVAILABLE",
              timestamp: new Date().toISOString(),
            },
            { status: 400 },
          );
        }
      }

      // If we have assigned staff, perform final availability check within transaction
      if (assignedStaffId && assignedStaff) {
        const bookingDate = new Date(datetime);

        // Check staff availability for the requested datetime
        if (!assignedStaff.isAvailableOnDate(bookingDate)) {
          await session.abortTransaction();
          return NextResponse.json(
            {
              error: "Staff member is not available on this date",
              code: "STAFF_NOT_AVAILABLE_DATE",
              timestamp: new Date().toISOString(),
            },
            { status: 400 },
          );
        }

        // CRITICAL: Final atomic check for conflicting bookings within transaction
        const serviceDuration = service.duration || 60;
        const endTime = new Date(
          bookingDate.getTime() + serviceDuration * 60000,
        );

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
        }).session(session);

        if (conflictingBooking) {
          await session.abortTransaction();
          return NextResponse.json(
            {
              error: "Staff member is not available at this time",
              code: "STAFF_TIME_CONFLICT",
              timestamp: new Date().toISOString(),
            },
            { status: 400 },
          );
        }
      }

      // Create booking atomically within transaction
      const totalPrice = typeof service.price === "number" ? service.price : 0;
      const serviceDuration = service.duration || 60;

      const bookingData: Partial<IBooking> = {
        customerId: currentUser.id,
        vendorId,
        serviceId,
        staffId: assignedStaffId || undefined,
        staffPreference,
        duration: serviceDuration,
        datetime: new Date(datetime),
        status: "pending",
        totalPrice,
        notes: notes || undefined,
        paymentStatus: "pending",
        reminderSent: false,
      };

      const [booking] = await Booking.create([bookingData], { session });

      // Commit transaction
      await session.commitTransaction();

      logger.info("Booking created successfully", {
        bookingId: booking._id,
        customerId: currentUser.id,
        vendorId,
        serviceId,
        staffId: assignedStaffId,
        datetime,
        totalPrice,
      });

      // Send booking confirmation notifications (outside transaction)
      try {
        await NotificationService.sendBookingConfirmation(
          booking._id.toString(),
        );
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
        {
          id: booking._id.toString(),
          success: true,
          booking: {
            id: booking._id.toString(),
            datetime: booking.datetime,
            status: booking.status,
            totalPrice: booking.totalPrice,
            staffId: assignedStaffId,
          },
        },
        { status: 201 },
      );
    } catch (transactionError) {
      // Rollback transaction on any error
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw transactionError;
    }
  } catch (error) {
    logger.error("Create booking error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to create booking",
        code: "BOOKING_CREATION_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    // Always end session
    if (session) {
      session.endSession();
    }
  }
}

export const GET = requireAuth(getBookingsHandler as any);
export const POST = requireAuth(createBookingHandler as any);
