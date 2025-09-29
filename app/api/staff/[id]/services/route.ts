import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";
import { AppError, ValidationError } from "@/lib/errors";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const assignServicesSchema = z.object({
  serviceIds: z
    .array(z.string())
    .min(1, "At least one service must be selected"),
});

// PUT /api/staff/[id]/services - Assign services to staff
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
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

    const Staff = (await import("../../../../../models/Staff")).default;
    const Service = (await import("../../../../../models/Service")).default;

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
    const { serviceIds } = assignServicesSchema.parse(body);

    // Verify all service IDs exist and belong to the vendor
    const services = await Service.find({
      _id: { $in: serviceIds },
      vendorId: staff.vendorId,
    });

    if (services.length !== serviceIds.length) {
      throw new ValidationError(
        "One or more services do not exist or do not belong to this vendor",
      );
    }

    // Update staff services
    staff.serviceIds = serviceIds;
    staff.updatedAt = new Date();
    await staff.save();

    // Populate services for response
    await staff.populate("serviceIds", "name price duration category");

    logger.info("Staff services updated", {
      staffId: staff._id,
      serviceCount: serviceIds.length,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        staffId: staff._id,
        serviceIds: staff.serviceIds,
        services: services,
      },
      message: "Staff services updated successfully",
    });
  } catch (error) {
    const params = await context.params;
    logger.error("Error updating staff services", {
      error,
      staffId: params.id,
    });

    if (error instanceof ValidationError || error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.message || "Validation failed" },
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

// GET /api/staff/[id]/services - Get services assigned to staff
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

    const staff = await Staff.findById(params.id).populate(
      "serviceIds",
      "name price duration category description",
    );

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

    logger.info("Staff services retrieved", {
      staffId: staff._id,
      serviceCount: staff.serviceIds?.length || 0,
      requestedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        staffId: staff._id,
        staffName: staff.name,
        services: staff.serviceIds || [],
      },
    });
  } catch (error) {
    const params = await context.params;
    logger.error("Error retrieving staff services", {
      error,
      staffId: params.id,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
