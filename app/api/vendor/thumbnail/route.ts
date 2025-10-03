import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Upload vendor featured thumbnail
async function uploadThumbnailHandler(request: NextRequest) {
  try {
    const currentUser = (request as any).user;

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (currentUser.userType !== "vendor") {
      return NextResponse.json(
        { error: "Only vendors can upload thumbnails" },
        { status: 403 },
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("thumbnail") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No thumbnail file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Convert file to base64 (for demo/testing - in production use cloud storage)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    // TODO: In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll store base64 in database (not recommended for production)
    const thumbnailUrl = base64Image;

    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Update user's profileImage
    await User.findByIdAndUpdate(currentUser.id, {
      profileImage: thumbnailUrl,
      updatedAt: new Date(),
    });

    logger.info("Vendor thumbnail uploaded", {
      vendorId: currentUser.id,
      fileSize: file.size,
      fileType: file.type,
    });

    return NextResponse.json({
      success: true,
      message: "Thumbnail uploaded successfully",
      thumbnailUrl: thumbnailUrl,
    });
  } catch (error: any) {
    logger.error("Error uploading thumbnail", { error });
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 },
    );
  }
}

// Export with authentication requirement
export const POST = requireAuth(uploadThumbnailHandler);
