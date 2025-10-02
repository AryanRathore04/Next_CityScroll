import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Review from "@/models/Review";

/**
 * GET /api/platform-stats
 * Fetch platform-wide statistics for the About page
 * Returns: total customers, total vendors, total cities, average rating
 */
export async function GET() {
  try {
    await connectDB();

    // Fetch total customers (userType: "customer")
    const totalCustomers = await User.countDocuments({
      userType: "customer",
      status: { $ne: "suspended" }, // Exclude suspended users
    });

    // Fetch total vendors (userType: "vendor")
    const totalVendors = await User.countDocuments({
      userType: "vendor",
      status: { $in: ["approved", "active"] }, // Only count approved/active vendors
    });

    // Fetch unique cities from vendor business addresses
    const citiesAggregation = await User.aggregate([
      {
        $match: {
          userType: "vendor",
          status: { $in: ["approved", "active"] },
          "businessAddress.city": { $exists: true, $ne: null },
        },
      },
      {
        $match: {
          "businessAddress.city": { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$businessAddress.city",
        },
      },
      {
        $count: "totalCities",
      },
    ]);

    const totalCities =
      citiesAggregation.length > 0 ? citiesAggregation[0].totalCities : 0;

    // Calculate average rating across all published reviews
    const ratingAggregation = await Review.aggregate([
      {
        $match: {
          status: "published",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const averageRating =
      ratingAggregation.length > 0
        ? Number(ratingAggregation[0].averageRating.toFixed(1))
        : 0;

    return NextResponse.json(
      {
        totalCustomers,
        totalVendors,
        totalCities,
        averageRating,
        lastUpdated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200", // Cache for 1 hour
        },
      },
    );
  } catch (error: any) {
    console.error("❌ [PLATFORM STATS API] Error fetching stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch platform statistics",
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
