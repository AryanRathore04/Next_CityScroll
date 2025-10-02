import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    await connectDB();

    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken",
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user statistics
    const [totalBookings, completedBookings, reviewsReceived] =
      await Promise.all([
        Booking.countDocuments({ customerId: user._id.toString() }),
        Booking.countDocuments({
          customerId: user._id.toString(),
          status: "completed",
        }),
        user.userType === "vendor"
          ? Review.countDocuments({
              vendorId: user._id.toString(),
              status: "published",
            })
          : 0,
      ]);

    // Calculate average rating for vendors
    let averageRating = user.rating || 0;
    if (user.userType === "vendor" && reviewsReceived > 0) {
      const ratingAggregation = await Review.aggregate([
        {
          $match: {
            vendorId: user._id.toString(),
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
    const memberSince = user.createdAt;
    const daysSinceMember = Math.floor(
      (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24),
    );

    const userProfile = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.userType,
      businessName: user.businessName,
      businessType: user.businessType,
      businessAddress: user.businessAddress,
      profileImage: user.profileImage,
      description: user.description,
      verified: user.verified,
      status: user.status,
      rating: averageRating,
      totalBookings,
      completedBookings,
      reviewsReceived,
      memberSince: memberSince.toISOString(),
      daysSinceMember,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

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
    console.error("❌ [USER PROFILE API] Error:", error);

    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch user profile", message: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

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

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password -refreshToken");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: user.toSafeObject(),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ [USER PROFILE UPDATE API] Error:", error);

    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to update profile", message: error.message },
      { status: 500 },
    );
  }
}
