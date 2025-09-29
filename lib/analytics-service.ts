import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { serverLogger as logger } from "@/lib/logger";

export interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    daily: Array<{ date: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
  };
  bookings: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    daily: Array<{ date: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  vendors: {
    total: number;
    active: number;
    verified: number;
    topPerformers: Array<{
      id: string;
      name: string;
      revenue: number;
      bookings: number;
      rating: number;
    }>;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    retention: number;
  };
  services: {
    total: number;
    popular: Array<{
      id: string;
      name: string;
      bookings: number;
      revenue: number;
    }>;
    categories: Array<{
      category: string;
      bookings: number;
      revenue: number;
    }>;
  };
  geography: {
    cities: Array<{
      city: string;
      bookings: number;
      revenue: number;
    }>;
    states: Array<{
      state: string;
      bookings: number;
      revenue: number;
    }>;
  };
}

export interface VendorAnalytics {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    pending: number;
    paid: number;
  };
  bookings: {
    total: number;
    thisMonth: number;
    completed: number;
    cancelled: number;
    cancellationRate: number;
  };
  customers: {
    total: number;
    repeat: number;
    new: number;
    repeatRate: number;
  };
  services: {
    popular: Array<{
      serviceId: string;
      name: string;
      bookings: number;
      revenue: number;
    }>;
  };
  ratings: {
    average: number;
    total: number;
    distribution: Array<{
      rating: number;
      count: number;
    }>;
  };
  trends: {
    daily: Array<{ date: string; bookings: number; revenue: number }>;
    monthly: Array<{ month: string; bookings: number; revenue: number }>;
  };
}

export class AnalyticsService {
  /**
   * Get platform-wide analytics (admin only)
   */
  static async getPlatformAnalytics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnalyticsData> {
    try {
      await connectDB();

      const defaultEndDate = endDate || new Date();
      const defaultStartDate =
        startDate ||
        new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Dynamic imports to avoid compilation issues
      const [
        { default: Booking },
        { default: User },
        { default: Service },
        { Transaction },
      ] = await Promise.all([
        import("@/models/Booking"),
        import("@/models/User"),
        import("@/models/Service"),
        import("@/models/Transaction").then((m) => ({
          Transaction: m.Transaction,
        })),
      ]);

      // Revenue Analytics
      const revenueData = await this.getRevenueAnalytics(
        Transaction,
        defaultStartDate,
        defaultEndDate,
      );

      // Booking Analytics
      const bookingData = await this.getBookingAnalytics(
        Booking,
        defaultStartDate,
        defaultEndDate,
      );

      // Vendor Analytics
      const vendorData = await this.getVendorOverview(
        User,
        Transaction,
        defaultStartDate,
        defaultEndDate,
      );

      // Customer Analytics
      const customerData = await this.getCustomerAnalytics(
        User,
        Booking,
        defaultStartDate,
        defaultEndDate,
      );

      // Service Analytics
      const serviceData = await this.getServiceAnalytics(
        Service,
        Booking,
        defaultStartDate,
        defaultEndDate,
      );

      // Geographic Analytics
      const geographyData = await this.getGeographyAnalytics(
        Booking,
        defaultStartDate,
        defaultEndDate,
      );

      return {
        revenue: revenueData,
        bookings: bookingData,
        vendors: vendorData,
        customers: customerData,
        services: serviceData,
        geography: geographyData,
      };
    } catch (error) {
      logger.error("Error getting platform analytics", { error });
      throw error;
    }
  }

  /**
   * Get vendor-specific analytics
   */
  static async getVendorAnalytics(
    vendorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VendorAnalytics> {
    try {
      await connectDB();

      const defaultEndDate = endDate || new Date();
      const defaultStartDate =
        startDate ||
        new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [{ default: Booking }, { default: Service }, { Transaction }] =
        await Promise.all([
          import("@/models/Booking"),
          import("@/models/Service"),
          import("@/models/Transaction").then((m) => ({
            Transaction: m.Transaction,
          })),
        ]);

      const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

      // Revenue analytics
      const revenueAnalytics = await Transaction.aggregate([
        {
          $match: {
            vendorId: vendorObjectId,
            type: "booking_payment",
            status: "completed",
            processedAt: { $gte: defaultStartDate, $lte: defaultEndDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$vendorAmount" },
            totalGross: { $sum: "$amount" },
            totalCommission: { $sum: "$platformCommission" },
          },
        },
      ]);

      // This month vs last month revenue
      const thisMonthStart = new Date(
        defaultEndDate.getFullYear(),
        defaultEndDate.getMonth(),
        1,
      );
      const lastMonthStart = new Date(
        defaultEndDate.getFullYear(),
        defaultEndDate.getMonth() - 1,
        1,
      );
      const lastMonthEnd = new Date(
        defaultEndDate.getFullYear(),
        defaultEndDate.getMonth(),
        0,
      );

      const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
        Transaction.aggregate([
          {
            $match: {
              vendorId: vendorObjectId,
              type: "booking_payment",
              status: "completed",
              processedAt: { $gte: thisMonthStart, $lte: defaultEndDate },
            },
          },
          { $group: { _id: null, amount: { $sum: "$vendorAmount" } } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              vendorId: vendorObjectId,
              type: "booking_payment",
              status: "completed",
              processedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            },
          },
          { $group: { _id: null, amount: { $sum: "$vendorAmount" } } },
        ]),
      ]);

      const thisMonthAmount = thisMonthRevenue[0]?.amount || 0;
      const lastMonthAmount = lastMonthRevenue[0]?.amount || 0;
      const revenueGrowth =
        lastMonthAmount > 0
          ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
          : 0;

      // Booking analytics
      const bookingStats = await Booking.aggregate([
        {
          $match: {
            vendorId: vendorObjectId,
            createdAt: { $gte: defaultStartDate, $lte: defaultEndDate },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalBookings = bookingStats.reduce(
        (sum: number, stat: any) => sum + stat.count,
        0,
      );
      const completedBookings =
        bookingStats.find((stat: any) => stat._id === "completed")?.count || 0;
      const cancelledBookings =
        bookingStats.find((stat: any) => stat._id === "cancelled")?.count || 0;
      const cancellationRate =
        totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

      // Customer analytics
      const customerStats = await Booking.aggregate([
        {
          $match: {
            vendorId: vendorObjectId,
            status: "completed",
            createdAt: { $gte: defaultStartDate, $lte: defaultEndDate },
          },
        },
        {
          $group: {
            _id: "$customerId",
            bookingCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            repeatCustomers: {
              $sum: { $cond: [{ $gt: ["$bookingCount", 1] }, 1, 0] },
            },
          },
        },
      ]);

      const totalCustomers = customerStats[0]?.totalCustomers || 0;
      const repeatCustomers = customerStats[0]?.repeatCustomers || 0;
      const repeatRate =
        totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

      // Popular services
      const popularServices = await Booking.aggregate([
        {
          $match: {
            vendorId: vendorObjectId,
            status: "completed",
            createdAt: { $gte: defaultStartDate, $lte: defaultEndDate },
          },
        },
        {
          $lookup: {
            from: "services",
            localField: "serviceId",
            foreignField: "_id",
            as: "service",
          },
        },
        { $unwind: "$service" },
        {
          $group: {
            _id: "$serviceId",
            name: { $first: "$service.name" },
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
      ]);

      // Daily trends for the last 30 days
      const dailyTrends = await Booking.aggregate([
        {
          $match: {
            vendorId: vendorObjectId,
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        {
          $addFields: {
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
              },
            },
          },
        },
        { $sort: { date: 1 } },
      ]);

      return {
        revenue: {
          total: revenueAnalytics[0]?.total || 0,
          thisMonth: thisMonthAmount,
          lastMonth: lastMonthAmount,
          growth: revenueGrowth,
          pending: 0, // Calculate from pending payouts
          paid: revenueAnalytics[0]?.total || 0,
        },
        bookings: {
          total: totalBookings,
          thisMonth: 0, // Calculate this month bookings
          completed: completedBookings,
          cancelled: cancelledBookings,
          cancellationRate,
        },
        customers: {
          total: totalCustomers,
          repeat: repeatCustomers,
          new: totalCustomers - repeatCustomers,
          repeatRate,
        },
        services: {
          popular: popularServices.map((service: any) => ({
            serviceId: service._id.toString(),
            name: service.name,
            bookings: service.bookings,
            revenue: service.revenue,
          })),
        },
        ratings: {
          average: 0, // Calculate from reviews
          total: 0,
          distribution: [],
        },
        trends: {
          daily: dailyTrends.map((trend: any) => ({
            date: trend.date.toISOString().split("T")[0],
            bookings: trend.bookings,
            revenue: trend.revenue,
          })),
          monthly: [], // Calculate monthly trends
        },
      };
    } catch (error) {
      logger.error("Error getting vendor analytics", { error, vendorId });
      throw error;
    }
  }

  private static async getRevenueAnalytics(
    Transaction: any,
    startDate: Date,
    endDate: Date,
  ) {
    const revenueStats = await Transaction.aggregate([
      {
        $match: {
          type: "booking_payment",
          status: "completed",
          processedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          platformRevenue: { $sum: "$platformCommission" },
        },
      },
    ]);

    // Monthly revenue trend
    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          type: "booking_payment",
          status: "completed",
          processedAt: {
            $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          }, // Last year
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$processedAt" },
            month: { $month: "$processedAt" },
          },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return {
      total: revenueStats[0]?.total || 0,
      thisMonth: 0, // Calculate current month
      lastMonth: 0, // Calculate last month
      growth: 0, // Calculate growth
      daily: [], // Calculate daily revenue
      monthly: monthlyRevenue.map((item: any) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        amount: item.amount,
      })),
    };
  }

  private static async getBookingAnalytics(
    Booking: any,
    startDate: Date,
    endDate: Date,
  ) {
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = bookingStats.reduce(
      (sum: number, stat: any) => sum + stat.count,
      0,
    );

    return {
      total,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
      daily: [],
      byStatus: bookingStats.map((stat: any) => ({
        status: stat._id,
        count: stat.count,
      })),
    };
  }

  private static async getVendorOverview(
    User: any,
    Transaction: any,
    startDate: Date,
    endDate: Date,
  ) {
    const vendorStats = await User.aggregate([
      { $match: { userType: "vendor" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    return {
      total: vendorStats[0]?.total || 0,
      active: 0,
      verified: 0,
      topPerformers: [],
    };
  }

  private static async getCustomerAnalytics(
    User: any,
    Booking: any,
    startDate: Date,
    endDate: Date,
  ) {
    const customerStats = await User.aggregate([
      { $match: { userType: "customer" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    return {
      total: customerStats[0]?.total || 0,
      active: 0,
      new: 0,
      retention: 0,
    };
  }

  private static async getServiceAnalytics(
    Service: any,
    Booking: any,
    startDate: Date,
    endDate: Date,
  ) {
    return {
      total: 0,
      popular: [],
      categories: [],
    };
  }

  private static async getGeographyAnalytics(
    Booking: any,
    startDate: Date,
    endDate: Date,
  ) {
    return {
      cities: [],
      states: [],
    };
  }
}
