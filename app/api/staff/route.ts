import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { validateRequest } from "@/lib/validation";
import { serverLogger as logger } from "@/lib/logger";
import { AppError, ValidationError } from "@/lib/errors";
import { staffCreationSchema, staffUpdateSchema } from "@/lib/validation";

// GET /api/staff - List all staff for a vendor
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user has permission to view staff
    if (user.userType !== "admin" && user.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    await connectDB();

    const Staff = (await import("../../../models/Staff")).default;

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId") || user.id;

    // Vendors can only see their own staff
    if (user.userType !== "admin" && user.id !== vendorId) {
      throw new AppError("Access denied", 403);
    }

    const staff = await Staff.find({ vendorId })
      .populate("serviceIds", "name price duration")
      .sort({ name: 1 });

    logger.info("Staff list retrieved", {
      vendorId,
      staffCount: staff.length,
      requestedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    logger.error("Error retrieving staff list", { error });

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

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
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

    const Staff = (await import("../../../models/Staff")).default;
    const User = (await import("../../../models/User")).default;
    const Service = (await import("../../../models/Service")).default;

    const body = await request.json();
    const validatedData = validateRequest(staffCreationSchema, body);

    // Ensure vendor can only create staff for themselves
    const vendorId =
      user.userType === "admin" ? validatedData.vendorId : user.id;

    // Verify vendor exists
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.userType !== "vendor") {
      throw new ValidationError("Invalid vendor");
    }

    // Verify all service IDs exist and belong to the vendor
    if (validatedData.serviceIds && validatedData.serviceIds.length > 0) {
      const services = await Service.find({
        _id: { $in: validatedData.serviceIds },
        vendorId,
      });

      if (services.length !== validatedData.serviceIds.length) {
        throw new ValidationError(
          "One or more services do not exist or do not belong to this vendor",
        );
      }
    }

    // Check for duplicate email within vendor
    const existingStaff = await Staff.findOne({
      vendorId,
      email: validatedData.email,
    });

    if (existingStaff) {
      throw new ValidationError("Staff member with this email already exists");
    }

    const staff = new Staff({
      ...validatedData,
      vendorId,
      isActive: true,
    });

    await staff.save();

    logger.info("New staff member created", {
      staffId: staff._id,
      vendorId,
      createdBy: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: staff,
        message: "Staff member created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Error creating staff member", { error });

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

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
