import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { validateRequest } from "@/lib/validation";
import { serverLogger as logger } from "@/lib/logger";
import { AppError, ValidationError } from "@/lib/errors";
import { staffUpdateSchema } from "@/lib/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/staff/[id] - Get staff member details
export async function GET(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const Staff = (await import("../../../../models/Staff")).default;
    const staff = await Staff.findById(params.id)
      .populate("serviceIds", "name price duration category")
      .populate("vendorId", "businessName firstName lastName");

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    // Check access permissions
    if (user.userType !== "admin" && user.id !== staff.vendorId.toString()) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    logger.info("Staff details retrieved", {
      staffId: staff._id,
      requestedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    logger.error("Error retrieving staff details", {
      error,
      staffId: params.id,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user has permission to manage staff
    if (user.userType !== "admin" && user.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    await connectDB();

    const Staff = (await import("../../../../models/Staff")).default;
    const Service = (await import("../../../../models/Service")).default;

    const staff = await Staff.findById(params.id);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    // Check access permissions
    if (user.userType !== "admin" && user.id !== staff.vendorId.toString()) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = validateRequest(staffUpdateSchema, body);

    // Verify service IDs if provided
    if (validatedData.serviceIds && validatedData.serviceIds.length > 0) {
      const services = await Service.find({
        _id: { $in: validatedData.serviceIds },
        vendorId: staff.vendorId,
      });

      if (services.length !== validatedData.serviceIds.length) {
        throw new ValidationError(
          "One or more services do not exist or do not belong to this vendor",
        );
      }
    }

    // Check for duplicate email if email is being updated
    if (validatedData.email && validatedData.email !== staff.email) {
      const existingStaff = await Staff.findOne({
        vendorId: staff.vendorId,
        email: validatedData.email,
        _id: { $ne: staff._id },
      });

      if (existingStaff) {
        throw new ValidationError(
          "Staff member with this email already exists",
        );
      }
    }

    // Update staff member
    Object.assign(staff, validatedData);
    staff.updatedAt = new Date();
    await staff.save();

    logger.info("Staff member updated", {
      staffId: staff._id,
      updatedBy: user.id,
      changes: Object.keys(validatedData),
    });

    // Return populated staff data
    const updatedStaff = await Staff.findById(staff._id)
      .populate("serviceIds", "name price duration category")
      .populate("vendorId", "businessName firstName lastName");

    return NextResponse.json({
      success: true,
      data: updatedStaff,
      message: "Staff member updated successfully",
    });
  } catch (error) {
    logger.error("Error updating staff member", { error, staffId: params.id });

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user has permission to manage staff
    if (user.userType !== "admin" && user.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    await connectDB();

    const Staff = (await import("../../../../models/Staff")).default;
    const Booking = (await import("../../../../models/Booking")).default;

    const staff = await Staff.findById(params.id);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    // Check access permissions
    if (user.userType !== "admin" && user.id !== staff.vendorId.toString()) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      staffId: staff._id,
      status: { $in: ["pending", "confirmed"] },
      datetime: { $gte: new Date() },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete staff member. They have ${activeBookings} active booking(s). Please reassign or cancel these bookings first.`,
        },
        { status: 400 },
      );
    }

    // Soft delete by marking as inactive
    staff.isActive = false;
    staff.updatedAt = new Date();
    await staff.save();

    logger.info("Staff member deactivated", {
      staffId: staff._id,
      deactivatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Staff member deactivated successfully",
    });
  } catch (error) {
    logger.error("Error deleting staff member", { error, staffId: params.id });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
