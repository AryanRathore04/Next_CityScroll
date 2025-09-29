import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import { sanitizeAndValidate } from "@/lib/validation";
import { serverLogger as logger } from "@/lib/logger";

// Validation schema for vendor response
const vendorResponseSchema = z.object({
  message: z.string().min(1, "Response message is required").max(500),
});

export const dynamic = "force-dynamic";

// POST /api/reviews/[id]/respond - Vendor response to a review
async function vendorResponseHandler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const reviewId = url.pathname.split("/")[3]; // Extract ID from URL

    const rawBody = await request.text();
    const bodyData = rawBody ? JSON.parse(rawBody) : {};

    const validation = sanitizeAndValidate(vendorResponseSchema, bodyData);
    if (!validation.success) {
      throw new ValidationError(validation.error);
    }

    const currentUser = (request as any).user;
    const { message } = validation.data;

    if (currentUser.userType !== "vendor") {
      throw new ValidationError("Only vendors can respond to reviews");
    }

    await connectDB();
    const Review = (await import("../../../../../models/Review")).default;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    // Verify vendor owns this review
    if (review.vendorId !== currentUser.id) {
      throw new ValidationError(
        "You can only respond to reviews for your business",
      );
    }

    // Check if already responded
    if (review.vendorResponse) {
      throw new ValidationError("You have already responded to this review");
    }

    // Add vendor response
    await review.addVendorResponse(message, currentUser.id);

    logger.info("Vendor response added", {
      reviewId,
      vendorId: currentUser.id,
    });

    return NextResponse.json({
      success: true,
      message: "Response added successfully",
      review: {
        id: review._id,
        vendorResponse: review.vendorResponse,
      },
    });
  } catch (error) {
    logger.error("Failed to add vendor response", {
      error: error instanceof Error ? error.message : String(error),
      userId: (request as any).user?.id,
    });

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Failed to add response" },
      { status: 500 },
    );
  }
}

export const POST = requirePermission(
  PERMISSIONS.UPDATE_OWN_PROFILE,
  vendorResponseHandler,
);
