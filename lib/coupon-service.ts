import { connectDB } from "@/lib/mongodb";
import { serverLogger as logger } from "@/lib/logger";
import mongoose from "mongoose";

export interface CouponValidationResult {
  valid: boolean;
  coupon?: any;
  discountAmount?: number;
  reason?: string;
}

export interface CouponUsageStats {
  totalCoupons: number;
  activeCoupons: number;
  totalUsage: number;
  totalDiscount: number;
  popularCoupons: Array<{
    code: string;
    title: string;
    uses: number;
    discountGiven: number;
  }>;
}

export class CouponService {
  /**
   * Validate a coupon code for a specific booking
   */
  static async validateCoupon(
    couponCode: string,
    customerId: string,
    booking: {
      vendorId: string;
      serviceId: string;
      datetime: Date;
      totalPrice: number;
      service?: { category: string };
    },
  ): Promise<CouponValidationResult> {
    try {
      await connectDB();
      const Coupon = (await import("../models/Coupon")).default;

      // Find coupon by code
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      }).populate("usedBy.customerId", "firstName lastName");

      if (!coupon) {
        return {
          valid: false,
          reason: "Invalid coupon code",
        };
      }

      // Check if coupon is currently valid (dates, usage limits)
      if (!coupon.isCurrentlyValid) {
        if (coupon.endDate < new Date()) {
          return { valid: false, reason: "Coupon has expired" };
        }
        if (coupon.startDate > new Date()) {
          return { valid: false, reason: "Coupon is not yet active" };
        }
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
          return { valid: false, reason: "Coupon usage limit reached" };
        }
      }

      // Check customer usage limit
      if (!coupon.canCustomerUse(customerId)) {
        return {
          valid: false,
          reason: `You have already used this coupon ${
            coupon.maxUsesPerCustomer || 1
          } time(s)`,
        };
      }

      // Check if first-time customer restriction applies
      if (coupon.firstTimeCustomersOnly) {
        const Booking = (await import("../models/Booking")).default;
        const existingBookings = await Booking.countDocuments({
          customerId: new mongoose.Types.ObjectId(customerId),
          status: "completed",
        });

        if (existingBookings > 0) {
          return {
            valid: false,
            reason: "This coupon is only valid for first-time customers",
          };
        }
      }

      // Check if coupon applies to this specific booking
      const bookingValidation = coupon.appliesToBooking(booking);
      if (!bookingValidation.valid) {
        return {
          valid: false,
          reason: bookingValidation.reason,
        };
      }

      // Check vendor rating requirement
      if (coupon.minimumRating) {
        const User = (await import("../models/User")).default;
        const vendor = await User.findById(booking.vendorId);
        if (!vendor || (vendor.rating || 0) < coupon.minimumRating) {
          return {
            valid: false,
            reason: `This coupon requires a vendor rating of at least ${coupon.minimumRating} stars`,
          };
        }
      }

      // Calculate discount
      const discountAmount = coupon.calculateDiscount(booking.totalPrice);

      return {
        valid: true,
        coupon,
        discountAmount,
      };
    } catch (error) {
      logger.error("Error validating coupon", {
        error,
        couponCode,
        customerId,
      });
      return {
        valid: false,
        reason: "Error validating coupon",
      };
    }
  }

  /**
   * Apply a coupon to a booking
   */
  static async applyCoupon(
    couponCode: string,
    customerId: string,
    bookingId: string,
    discountAmount: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await connectDB();
      const Coupon = (await import("../models/Coupon")).default;

      // Update coupon usage
      const result = await Coupon.findOneAndUpdate(
        {
          code: couponCode.toUpperCase(),
          isActive: true,
        },
        {
          $inc: { currentUses: 1 },
          $push: {
            usedBy: {
              customerId: new mongoose.Types.ObjectId(customerId),
              bookingId: new mongoose.Types.ObjectId(bookingId),
              usedAt: new Date(),
              discountAmount,
            },
          },
        },
        { new: true },
      );

      if (!result) {
        return { success: false, error: "Coupon not found or inactive" };
      }

      logger.info("Coupon applied successfully", {
        couponCode,
        customerId,
        bookingId,
        discountAmount,
      });

      return { success: true };
    } catch (error) {
      logger.error("Error applying coupon", {
        error,
        couponCode,
        customerId,
        bookingId,
      });
      return { success: false, error: "Failed to apply coupon" };
    }
  }

  /**
   * Create a new coupon
   */
  static async createCoupon(
    couponData: any,
    createdBy: string,
  ): Promise<{
    success: boolean;
    coupon?: any;
    error?: string;
  }> {
    try {
      await connectDB();
      const Coupon = (await import("../models/Coupon")).default;

      // Check if coupon code already exists
      const existing = await Coupon.findOne({
        code: couponData.code.toUpperCase(),
      });

      if (existing) {
        return { success: false, error: "Coupon code already exists" };
      }

      const coupon = new Coupon({
        ...couponData,
        code: couponData.code.toUpperCase(),
        createdBy: new mongoose.Types.ObjectId(createdBy),
      });

      await coupon.save();

      logger.info("Coupon created successfully", {
        couponId: coupon._id,
        code: coupon.code,
        createdBy,
      });

      return { success: true, coupon };
    } catch (error) {
      logger.error("Error creating coupon", { error, couponData, createdBy });
      return { success: false, error: "Failed to create coupon" };
    }
  }

  /**
   * Get available coupons for a customer
   */
  static async getAvailableCoupons(
    customerId: string,
    vendorId?: string,
    serviceCategory?: string,
  ): Promise<any[]> {
    try {
      await connectDB();
      const Coupon = (await import("../models/Coupon")).default;

      const now = new Date();
      const matchQuery: any = {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { maxUses: { $exists: false } },
          { $expr: { $lt: ["$currentUses", "$maxUses"] } },
        ],
      };

      // Add vendor filter
      if (vendorId) {
        matchQuery.$or = [
          { vendorId: new mongoose.Types.ObjectId(vendorId) },
          { vendorId: { $exists: false } }, // Platform-wide coupons
        ];
      } else {
        matchQuery.vendorId = { $exists: false }; // Only platform-wide coupons
      }

      // Add service category filter
      if (serviceCategory) {
        matchQuery.$or = [
          ...(matchQuery.$or || []),
          { serviceCategories: { $exists: false } },
          { serviceCategories: { $size: 0 } },
          { serviceCategories: serviceCategory },
        ];
      }

      const coupons = await Coupon.find(matchQuery)
        .sort({ value: -1, endDate: 1 })
        .limit(20);

      // Filter out coupons customer has already used (if usage limit reached)
      return coupons.filter((coupon) => coupon.canCustomerUse(customerId));
    } catch (error) {
      logger.error("Error getting available coupons", {
        error,
        customerId,
        vendorId,
      });
      return [];
    }
  }

  /**
   * Get coupon usage statistics
   */
  static async getCouponStats(
    vendorId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CouponUsageStats> {
    try {
      await connectDB();
      const Coupon = (await import("../models/Coupon")).default;

      const matchQuery: any = {};
      if (vendorId) {
        matchQuery.vendorId = new mongoose.Types.ObjectId(vendorId);
      }

      const pipeline: any[] = [
        { $match: matchQuery },
        {
          $facet: {
            overview: [
              {
                $group: {
                  _id: null,
                  totalCoupons: { $sum: 1 },
                  activeCoupons: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            "$isActive",
                            { $lte: ["$startDate", new Date()] },
                            { $gte: ["$endDate", new Date()] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  totalUsage: { $sum: "$currentUses" },
                },
              },
            ],
            popularCoupons: [
              { $match: { currentUses: { $gt: 0 } } },
              {
                $project: {
                  code: 1,
                  title: 1,
                  uses: "$currentUses",
                  discountGiven: {
                    $sum: "$usedBy.discountAmount",
                  },
                },
              },
              { $sort: { uses: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ];

      const results = await Coupon.aggregate(pipeline);
      const statsResult = results[0] || { overview: [{}], popularCoupons: [] };
      const overview = statsResult.overview[0] || {
        totalCoupons: 0,
        activeCoupons: 0,
        totalUsage: 0,
      };

      // Calculate total discount given
      const totalDiscountPipeline = [
        { $match: matchQuery },
        { $unwind: "$usedBy" },
        {
          $group: {
            _id: null,
            totalDiscount: { $sum: "$usedBy.discountAmount" },
          },
        },
      ];

      const discountResults = await Coupon.aggregate(totalDiscountPipeline);
      const totalDiscount = discountResults[0]?.totalDiscount || 0;

      return {
        ...overview,
        totalDiscount,
        popularCoupons: statsResult.popularCoupons || [],
      };
    } catch (error) {
      logger.error("Error getting coupon stats", { error, vendorId });
      return {
        totalCoupons: 0,
        activeCoupons: 0,
        totalUsage: 0,
        totalDiscount: 0,
        popularCoupons: [],
      };
    }
  }

  /**
   * Generate a random coupon code
   */
  static generateCouponCode(prefix: string = "", length: number = 8): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = prefix.toUpperCase();

    for (let i = result.length; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Deactivate expired coupons (cleanup job)
   */
  static async deactivateExpiredCoupons(): Promise<number> {
    try {
      await connectDB();
      const Coupon = (await import("../models/Coupon")).default;

      const result = await Coupon.updateMany(
        {
          isActive: true,
          endDate: { $lt: new Date() },
        },
        {
          $set: { isActive: false },
        },
      );

      logger.info("Deactivated expired coupons", {
        count: result.modifiedCount,
      });
      return result.modifiedCount;
    } catch (error) {
      logger.error("Error deactivating expired coupons", { error });
      return 0;
    }
  }
}
