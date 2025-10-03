import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import { serverLogger as logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const userDoc = await User.findById(user.id).select(
      "-password -refreshToken",
    );
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user statistics
    const [totalBookings, completedBookings, reviewsReceived] =
      await Promise.all([
        Booking.countDocuments({ customerId: userDoc._id.toString() }),
        Booking.countDocuments({
          customerId: userDoc._id.toString(),
          status: "completed",
        }),
        userDoc.userType === "vendor"
          ? Review.countDocuments({
              vendorId: userDoc._id.toString(),
              status: "published",
            })
          : 0,
      ]);

    // Calculate average rating for vendors
    let averageRating = userDoc.rating || 0;
    if (userDoc.userType === "vendor" && reviewsReceived > 0) {
      const ratingAggregation = await Review.aggregate([
        {
          $match: {
            vendorId: userDoc._id.toString(),
            status: "published",
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
          },
        },
      ]);
      averageRating =
        ratingAggregation.length > 0
          ? Number(ratingAggregation[0].avgRating.toFixed(1))
          : 0;
    }

    // Calculate member duration
    const memberSince = userDoc.createdAt;
    const daysSinceMember = Math.floor(
      (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24),
    );

    const userProfile = {
      id: userDoc._id.toString(),
      email: userDoc.email,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      phone: userDoc.phone,
      userType: userDoc.userType,
      businessName: userDoc.businessName,
      businessType: userDoc.businessType,
      businessAddress: userDoc.businessAddress,
      profileImage: userDoc.profileImage,
      description: userDoc.description,
      verified: userDoc.verified,
      status: userDoc.status,
      rating: averageRating,
      totalBookings,
      completedBookings,
      reviewsReceived,
      memberSince: memberSince.toISOString(),
      daysSinceMember,
      createdAt: userDoc.createdAt.toISOString(),
      updatedAt: userDoc.updatedAt.toISOString(),
    };

    logger.info("User profile fetched", {
      userId: user.id,
      userType: userDoc.userType,
    });

    return NextResponse.json(
      { user: userProfile },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error: any) {
    logger.error("Error fetching user profile", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to fetch user profile", message: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      profileImage,
      description,
      businessName,
      businessType,
      businessAddress,
    } = body;

    await connectDB();

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    if (description) updateData.description = description;
    if (businessName) updateData.businessName = businessName;
    if (businessType) updateData.businessType = businessType;
    if (businessAddress) updateData.businessAddress = businessAddress;

    const userDoc = await User.findByIdAndUpdate(
      user.id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password -refreshToken");

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logger.info("User profile updated", {
      userId: user.id,
      fields: Object.keys(updateData),
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: userDoc.toSafeObject(),
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error("Error updating user profile", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to update profile", message: error.message },
      { status: 500 },
    );
  }
}
