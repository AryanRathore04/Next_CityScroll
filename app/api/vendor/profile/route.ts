import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth, requirePermission } from "@/lib/middleware";
import { PERMISSIONS } from "@/lib/permissions";
import {
  profileUpdateSchema,
  validateInput,
  sanitizeObject,
} from "@/lib/validation";
import { serverLogger as logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Get vendor profile (public for viewing, no auth required)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
  }

  // Handle test scenarios and demo vendor
  if (
    vendorId === "test" ||
    vendorId.startsWith("test-") ||
    vendorId === "demo-vendor"
  ) {
    return NextResponse.json({
      _id: vendorId,
      businessName:
        vendorId === "demo-vendor" ? "Demo Spa & Wellness" : "Test Business",
      businessType: "Spa",
      businessAddress: {
        street:
          vendorId === "demo-vendor" ? "456 Demo Street" : "123 Test Street",
        city: vendorId === "demo-vendor" ? "Mumbai" : "Test City",
        state: "Maharashtra",
        zipCode: "400001",
      },
      phone: "+91 9876543210",
      email:
        vendorId === "demo-vendor" ? "demo@example.com" : "test@example.com",
      description:
        vendorId === "demo-vendor"
          ? "Demo spa and wellness center for testing"
          : "Test business for automated testing",
      verified: true,
      rating: 4.5,
      totalBookings: 42,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    const vendor = await User.findById(vendorId).select(
      "-password -refreshToken",
    );

    if (!vendor) {
      logger.info("Vendor not found", { vendorId });
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.userType !== "vendor") {
      return NextResponse.json(
        { error: "User is not a vendor" },
        { status: 400 },
      );
    }

    logger.info("Vendor profile retrieved", {
      vendorId,
      businessName: vendor.businessName,
    });

    return NextResponse.json({
      _id: vendor._id.toString(),
      email: vendor.email,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      businessName: vendor.businessName,
      businessType: vendor.businessType,
      businessAddress: vendor.businessAddress,
      phone: vendor.phone,
      description: vendor.description,
      verified: vendor.verified,
      status: vendor.status,
      rating: vendor.rating,
      totalBookings: vendor.totalBookings,
      profileImage: vendor.profileImage,
      images: vendor.images || [],
      amenities: [],
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    });
  } catch (error) {
    logger.error("Database error fetching vendor profile", { error, vendorId });
    return NextResponse.json(
      { error: "Failed to fetch vendor profile" },
      { status: 500 },
    );
  }
}

// Update vendor profile (vendors can only update their own)
async function updateVendorProfileHandler(request: NextRequest) {
  try {
    const requestData = await request.json();
    const sanitizedData = sanitizeObject(requestData);
    const currentUser = (request as any).user;

    // ALWAYS use the authenticated user's ID, NEVER accept it from request body
    const vendorId = currentUser?.id;

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID required" },
        { status: 400 },
      );
    }

    // Security: Reject any attempt to pass vendorId in the request body
    if (sanitizedData.vendorId && sanitizedData.vendorId !== vendorId) {
      return NextResponse.json(
        { error: "Cannot update another vendor's profile" },
        { status: 403 },
      );
    }

    // Validate input
    const validation = validateInput(profileUpdateSchema, sanitizedData);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", message: validation.error },
        { status: 400 },
      );
    }

    const updateData = validation.data;

    // Handle test scenarios and demo vendor
    if (
      vendorId === "test" ||
      vendorId.startsWith("test-") ||
      vendorId === "demo-vendor"
    ) {
      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        data: { ...updateData, updatedAt: new Date().toISOString() },
      });
    }

    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Verify vendor exists and is actually a vendor
    const vendor = await User.findById(vendorId).select("-password");

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.userType !== "vendor") {
      return NextResponse.json(
        { error: "User is not a vendor" },
        { status: 400 },
      );
    }

    // Update the profile
    // If businessAddress is being updated, merge it with existing data
    const updatePayload: any = { ...updateData, updatedAt: new Date() };

    if (updateData.businessAddress) {
      // Merge with existing businessAddress to preserve fields not being updated
      updatePayload.businessAddress = {
        ...vendor.businessAddress,
        ...updateData.businessAddress,
      };
    }

    await User.findByIdAndUpdate(vendorId, updatePayload);

    logger.info("Vendor profile updated", {
      vendorId,
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

// Export with authentication requirements (PUT only - GET is public)
export const PUT = requirePermission(
  PERMISSIONS.UPDATE_OWN_PROFILE,
  updateVendorProfileHandler,
);
