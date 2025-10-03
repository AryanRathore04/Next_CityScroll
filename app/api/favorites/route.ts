import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import Favorite from "@/models/Favorite";
import User from "@/models/User";
import { serverLogger as logger } from "@/lib/logger";
import mongoose from "mongoose";

// GET /api/favorites - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDB();

    const favorites = await Favorite.find({ userId: user.id })
      .populate({
        path: "vendorId",
        select:
          "businessName businessAddress businessType rating totalBookings profileImage",
      })
      .sort({ createdAt: -1 })
      .lean();

    logger.info("User favorites retrieved", {
      userId: user.id,
      count: favorites.length,
    });

    return NextResponse.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    logger.error("Error retrieving favorites", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to retrieve favorites" },
      { status: 500 },
    );
  }
}

// POST /api/favorites - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { vendorId } = body;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Vendor ID is required" },
        { status: 400 },
      );
    }

    // Validate vendorId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { success: false, error: "Invalid vendor ID format" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check if vendor exists
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 },
      );
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: user.id,
      vendorId,
    });

    if (existingFavorite) {
      return NextResponse.json(
        { success: false, error: "Already in favorites" },
        { status: 400 },
      );
    }

    // Create favorite
    const favorite = await Favorite.create({
      userId: user.id,
      vendorId,
    });

    logger.info("Favorite added", {
      userId: user.id,
      vendorId,
      favoriteId: favorite._id,
    });

    return NextResponse.json(
      {
        success: true,
        data: favorite,
        message: "Added to favorites",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Error adding favorite", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to add to favorites" },
      { status: 500 },
    );
  }
}
