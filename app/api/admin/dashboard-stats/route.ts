import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/middleware";
import { connectDB } from "@/lib/mongodb";
import { PERMISSIONS } from "@/lib/permissions";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Transaction from "@/models/Transaction";

export const dynamic = "force-dynamic";

async function getDashboardStatsHandler(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get total users
    const [totalUsers, lastMonthUsers] = await Promise.all([
      User.countDocuments({ status: { $ne: "suspended" } }),
      User.countDocuments({
        status: { $ne: "suspended" },
        createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
      }),
    ]);

    const currentMonthUsers = await User.countDocuments({
      status: { $ne: "suspended" },
      createdAt: { $gte: firstDayOfMonth },
    });

    const userChange =
      lastMonthUsers > 0
        ? (
            ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) *
            100
          ).toFixed(1)
        : "0.0";

    // Get monthly bookings
    const [totalMonthlyBookings, lastMonthBookings] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
      Booking.countDocuments({
        createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
      }),
    ]);

    const bookingChange =
      lastMonthBookings > 0
        ? (
            ((totalMonthlyBookings - lastMonthBookings) / lastMonthBookings) *
            100
          ).toFixed(1)
        : "0.0";

    // Get revenue (from transactions)
    const currentMonthRevenue = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: firstDayOfMonth },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const lastMonthRevenue = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const currentRevenue =
      currentMonthRevenue.length > 0 ? currentMonthRevenue[0].total : 0;
    const previousRevenue =
      lastMonthRevenue.length > 0 ? lastMonthRevenue[0].total : 0;

    const revenueChange =
      previousRevenue > 0
        ? (
            ((currentRevenue - previousRevenue) / previousRevenue) *
            100
          ).toFixed(1)
        : "0.0";

    // Format revenue (assuming INR)
    const formatRevenue = (amount: number) => {
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
      } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
      }
      return `₹${amount.toFixed(0)}`;
    };

    // Get active vendors
    const [activeVendors, lastMonthActiveVendors] = await Promise.all([
      User.countDocuments({
        userType: "vendor",
        status: { $in: ["approved", "active"] },
      }),
      User.countDocuments({
        userType: "vendor",
        status: { $in: ["approved", "active"] },
        createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
      }),
    ]);

    const currentMonthActiveVendors = await User.countDocuments({
      userType: "vendor",
      status: { $in: ["approved", "active"] },
      createdAt: { $gte: firstDayOfMonth },
    });

    const vendorChange =
      lastMonthActiveVendors > 0
        ? (
            ((currentMonthActiveVendors - lastMonthActiveVendors) /
              lastMonthActiveVendors) *
            100
          ).toFixed(1)
        : "0.0";

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers: {
            value: totalUsers.toLocaleString(),
            change: `${userChange >= "0" ? "+" : ""}${userChange}%`,
            trend: parseFloat(userChange) >= 0 ? "up" : "down",
          },
          monthlyBookings: {
            value: totalMonthlyBookings.toLocaleString(),
            change: `${bookingChange >= "0" ? "+" : ""}${bookingChange}%`,
            trend: parseFloat(bookingChange) >= 0 ? "up" : "down",
          },
          revenue: {
            value: formatRevenue(currentRevenue),
            rawValue: currentRevenue,
            change: `${revenueChange >= "0" ? "+" : ""}${revenueChange}%`,
            trend: parseFloat(revenueChange) >= 0 ? "up" : "down",
          },
          activeVendors: {
            value: activeVendors.toLocaleString(),
            change: `${vendorChange >= "0" ? "+" : ""}${vendorChange}%`,
            trend: parseFloat(vendorChange) >= 0 ? "up" : "down",
          },
        },
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, max-age=0",
        },
      },
    );
  } catch (error: any) {
    console.error("❌ [ADMIN STATS API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics", message: error.message },
      { status: 500 },
    );
  }
}

export const GET = requirePermission(
  PERMISSIONS.VIEW_ALL_ANALYTICS,
  getDashboardStatsHandler,
);
