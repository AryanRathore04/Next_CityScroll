import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import Favorite from "@/models/Favorite";
import { serverLogger as logger } from "@/lib/logger";
import mongoose from "mongoose";

// DELETE /api/favorites/[id] - Remove from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Validate id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid favorite ID format" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find and delete favorite (only if it belongs to the user)
    const favorite = await Favorite.findOneAndDelete({
      _id: id,
      userId: user.id,
    });

    if (!favorite) {
      return NextResponse.json(
        { success: false, error: "Favorite not found" },
        { status: 404 },
      );
    }

    logger.info("Favorite removed", {
      userId: user.id,
      favoriteId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Removed from favorites",
    });
  } catch (error) {
    logger.error("Error removing favorite", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to remove from favorites" },
      { status: 500 },
    );
  }
}
