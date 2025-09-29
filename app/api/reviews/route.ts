import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import { sanitizeAndValidate } from "@/lib/validation";
import { serverLogger as logger } from "@/lib/logger";

// Validation schema for creating a review
const createReviewSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  rating: z.number().min(1).max(5),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000),
  photos: z.array(z.string().url()).optional(),
  isAnonymous: z.boolean().optional().default(false),
});

// Validation schema for vendor response
const vendorResponseSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  message: z.string().min(1, "Response message is required").max(500),
});

export const dynamic = "force-dynamic";

// GET /api/reviews - Get reviews with filtering and pagination
async function getReviewsHandler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const vendorId = url.searchParams.get("vendorId");
    const customerId = url.searchParams.get("customerId");
    const serviceId = url.searchParams.get("serviceId");
    const rating = url.searchParams.get("rating");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const sortBy = url.searchParams.get("sortBy") || "createdAt"; // createdAt, rating, helpfulVotes
    const sortOrder = url.searchParams.get("sortOrder") || "desc"; // asc, desc

    await connectDB();
    const Review = (await import("../../../models/Review")).default;

    // Build query
    const query: any = { status: "published" };

    if (vendorId) query.vendorId = vendorId;
    if (customerId) query.customerId = customerId;
    if (serviceId) query.serviceId = serviceId;
    if (rating) query.rating = parseInt(rating);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate("customer", "firstName lastName profileImage")
        .populate("vendor", "businessName")
        .populate("service", "name duration")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    // Get vendor stats if specific vendor requested
    let vendorStats = null;
    if (vendorId) {
      vendorStats = await (Review as any).getVendorStats(vendorId);
    }

    const response = {
      reviews: reviews.map((review) => ({
        ...review,
        customer: review.isAnonymous ? null : review.customer,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + reviews.length < totalCount,
      },
      vendorStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Failed to fetch reviews", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

// POST /api/reviews - Create a new review
async function createReviewHandler(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const bodyData = rawBody ? JSON.parse(rawBody) : {};

    const validation = sanitizeAndValidate(createReviewSchema, bodyData);
    if (!validation.success) {
      throw new ValidationError(validation.error);
    }

    const currentUser = (request as any).user;
    const { bookingId, rating, comment, photos, isAnonymous } = validation.data;

    await connectDB();
    const Review = (await import("../../../models/Review")).default;
    const Booking = (await import("../../../models/Booking")).default;

    // Check if user can review this booking
    const canReview = await (Review as any).canUserReview(
      currentUser.id,
      bookingId,
    );
    if (!canReview.canReview) {
      throw new ValidationError(
        canReview.reason || "Cannot review this booking",
      );
    }

    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.customerId !== currentUser.id) {
      throw new ValidationError("You can only review your own bookings");
    }

    // Create review
    const review = new Review({
      bookingId,
      customerId: currentUser.id,
      vendorId: booking.vendorId,
      serviceId: booking.serviceId,
      rating,
      comment,
      photos: photos || [],
      isAnonymous: isAnonymous || false,
      isVerifiedBooking: true,
      reviewSource: "post_booking",
    });

    await review.save();

    // Populate the review before returning
    await review.populate("customer", "firstName lastName profileImage");
    await review.populate("vendor", "businessName");
    await review.populate("service", "name duration");

    logger.info("Review created successfully", {
      reviewId: review._id,
      bookingId,
      customerId: currentUser.id,
      vendorId: booking.vendorId,
      rating,
    });

    const response = {
      ...review.toObject(),
      customer: review.isAnonymous ? null : review.customer,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Review created successfully",
        review: response,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to create review", {
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
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}

// POST /api/reviews/respond - Vendor response to a review
async function vendorResponseHandler(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const bodyData = rawBody ? JSON.parse(rawBody) : {};

    const validation = sanitizeAndValidate(vendorResponseSchema, bodyData);
    if (!validation.success) {
      throw new ValidationError(validation.error);
    }

    const currentUser = (request as any).user;
    const { reviewId, message } = validation.data;

    if (currentUser.userType !== "vendor") {
      throw new ValidationError("Only vendors can respond to reviews");
    }

    await connectDB();
    const Review = (await import("../../../models/Review")).default;

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

// Route handlers
export const GET = getReviewsHandler;
export const POST = requirePermission(
  PERMISSIONS.CREATE_BOOKINGS,
  createReviewHandler,
);
