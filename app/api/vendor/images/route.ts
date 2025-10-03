import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// POST /api/vendor/images - Upload vendor images
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    if (user.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Only vendors can upload images" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("images");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No images provided" },
        { status: 400 },
      );
    }

    // For now, we'll use a simple approach with base64 data URLs
    // In production, you'd want to upload to a service like Cloudinary, AWS S3, etc.
    const imageUrls: string[] = [];

    for (const file of files) {
      if (file instanceof File) {
        // Convert to base64 data URL
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64}`;
        imageUrls.push(dataUrl);
      }
    }

    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Get current user
    const vendor = await User.findById(user.id);
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 },
      );
    }

    // Add new images to existing images array
    const currentImages = vendor.images || [];
    const updatedImages = [...currentImages, ...imageUrls];

    // Update vendor with new images
    await User.findByIdAndUpdate(user.id, {
      images: updatedImages,
      updatedAt: new Date(),
    });

    logger.info("Vendor images uploaded", {
      vendorId: user.id,
      imageCount: imageUrls.length,
    });

    return NextResponse.json({
      success: true,
      message: "Images uploaded successfully",
      images: updatedImages,
    });
  } catch (error) {
    logger.error("Error uploading vendor images", { error });
    return NextResponse.json(
      { success: false, error: "Failed to upload images" },
      { status: 500 },
    );
  }
}

// DELETE /api/vendor/images - Delete a vendor image
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    if (user.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Only vendors can delete images" },
        { status: 403 },
      );
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL required" },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Get current user
    const vendor = await User.findById(user.id);
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 },
      );
    }

    // Remove image from array
    const currentImages = vendor.images || [];
    const updatedImages = currentImages.filter(
      (img: string) => img !== imageUrl,
    );

    // Update vendor
    await User.findByIdAndUpdate(user.id, {
      images: updatedImages,
      updatedAt: new Date(),
    });

    logger.info("Vendor image deleted", {
      vendorId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      images: updatedImages,
    });
  } catch (error) {
    logger.error("Error deleting vendor image", { error });
    return NextResponse.json(
      { success: false, error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
