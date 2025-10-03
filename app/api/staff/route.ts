import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { validateRequest } from "@/lib/validation";
import { serverLogger as logger } from "@/lib/logger";
import { AppError, ValidationError } from "@/lib/errors";
import { staffCreationSchema, staffUpdateSchema } from "@/lib/validation";

// GET /api/staff - List all staff for a vendor (public endpoint for booking)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const Staff = (await import("../../../models/Staff")).default;

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    // Require vendorId for queries
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "vendorId is required" },
        { status: 400 },
      );
    }

    // Try to get authenticated user for additional access control
    let user: any = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      try {
        user = await verifyAuth(request);
      } catch (authError) {
        // Ignore auth errors for public access
        logger.info("Staff query without valid auth - public access", {
          vendorId,
        });
      }
    }

    // For authenticated vendors/admins, apply permission checks
    if (user && user.userType === "vendor") {
      // Vendors can only see their own staff
      if (user.id !== vendorId) {
        throw new AppError(
          "Access denied - vendors can only view their own staff",
          403,
        );
      }
    }
    // Customers and admins can view any vendor's staff for booking purposes
    // No additional permission checks needed

    const staff = await Staff.find({ vendorId: vendorId, isActive: true })
      .populate("services", "name price duration")
      .sort({ firstName: 1, lastName: 1 });

    logger.info("Staff list retrieved", {
      vendorId: vendorId,
      staffCount: staff.length,
      requestedBy: user?.id || "public",
      userType: user?.userType || "public",
    });

    // Return safe staff data for customers (hide sensitive info)
    // Full data for vendors viewing their own staff and admins
    const shouldReturnFullData =
      user &&
      (user.userType === "admin" ||
        (user.userType === "vendor" && user.id === vendorId));

    const staffData = shouldReturnFullData
      ? staff
      : staff.map((s) => ({
          _id: s._id,
          firstName: s.firstName,
          lastName: s.lastName,
          specialization: s.specialization,
          services: s.services,
          isActive: s.isActive,
          rating: s.rating,
          experience: s.experience,
          bio: s.bio,
          avatar: s.avatar,
        }));

    return NextResponse.json({
      success: true,
      data: staffData,
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
    const vendor = await User.findById(vendorId).select("-password");
    if (!vendor || vendor.userType !== "vendor") {
      throw new ValidationError("Invalid vendor");
    }

    // Verify all service IDs exist and belong to the vendor
    if (validatedData.services && validatedData.services.length > 0) {
      const services = await Service.find({
        _id: { $in: validatedData.services },
        vendorId,
      });

      if (services.length !== validatedData.services.length) {
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

    // Import default schedule if no schedule provided
    const { defaultStaffSchedule } = await import("../../../models/Staff");

    const staff = new Staff({
      ...validatedData,
      vendorId,
      isActive: true,
      // Use provided schedule or default schedule
      schedule: validatedData.schedule || defaultStaffSchedule,
    });

    await staff.save();

    logger.info("New staff member created", {
      staffId: staff._id,
      vendorId,
      createdBy: user.id,
      hasSchedule: !!staff.schedule,
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
    logger.error("Error creating staff member", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

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

    // Return detailed error message in development
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
