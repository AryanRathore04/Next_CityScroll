import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "free_service";
  value: number; // Percentage (0-100) or fixed amount in cents
  minimumAmount?: number; // Minimum booking amount to apply coupon
  maximumDiscount?: number; // Maximum discount amount (for percentage coupons)

  // Applicability
  vendorId?: string; // If null, applies to all vendors (platform coupon)
  serviceCategories?: string[]; // Specific service categories
  serviceIds?: string[]; // Specific services

  // Usage limits
  maxUses?: number; // Total usage limit
  maxUsesPerCustomer?: number; // Per customer usage limit
  currentUses: number;

  // Validity
  startDate: Date;
  endDate: Date;
  isActive: boolean;

  // Conditions
  firstTimeCustomersOnly?: boolean;
  minimumRating?: number; // Minimum vendor rating required
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  timeSlots?: Array<{
    start: string; // "09:00"
    end: string; // "17:00"
  }>;

  // Tracking
  createdBy: string; // Admin or Vendor ID
  usedBy: Array<{
    customerId: string;
    bookingId: string;
    usedAt: Date;
    discountAmount: number;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[A-Z0-9]+$/,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed_amount", "free_service"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumAmount: {
      type: Number,
      min: 0,
    },
    maximumDiscount: {
      type: Number,
      min: 0,
    },

    // Applicability
    vendorId: {
      type: String,
      ref: "User",
    },
    serviceCategories: [
      {
        type: String,
      },
    ],
    serviceIds: [
      {
        type: String,
        ref: "Service",
      },
    ],

    // Usage limits
    maxUses: {
      type: Number,
      min: 1,
    },
    maxUsesPerCustomer: {
      type: Number,
      min: 1,
      default: 1,
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Validity
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Conditions
    firstTimeCustomersOnly: {
      type: Boolean,
      default: false,
    },
    minimumRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    daysOfWeek: [
      {
        type: Number,
        min: 0,
        max: 6,
      },
    ],
    timeSlots: [
      {
        start: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
      },
    ],

    // Tracking
    createdBy: {
      type: String,
      required: true,
      ref: "User",
    },
    usedBy: [
      {
        customerId: {
          type: String,
          required: true,
          ref: "User",
        },
        bookingId: {
          type: String,
          required: true,
          ref: "Booking",
        },
        usedAt: {
          type: Date,
          required: true,
        },
        discountAmount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
CouponSchema.index({ code: 1 });
CouponSchema.index({ vendorId: 1, isActive: 1 });
CouponSchema.index({ startDate: 1, endDate: 1 });
CouponSchema.index({ type: 1, isActive: 1 });
CouponSchema.index({ createdBy: 1 });
CouponSchema.index({ "usedBy.customerId": 1 });

// Validate end date is after start date
CouponSchema.pre("validate", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  }
  next();
});

// Validate percentage value
CouponSchema.pre("validate", function (next) {
  if (this.type === "percentage" && this.value > 100) {
    next(new Error("Percentage value cannot exceed 100"));
  }
  next();
});

// Virtual for checking if coupon is currently valid
CouponSchema.virtual("isCurrentlyValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    this.startDate <= now &&
    this.endDate >= now &&
    (!this.maxUses || this.currentUses < this.maxUses)
  );
});

// Virtual for usage percentage
CouponSchema.virtual("usagePercentage").get(function () {
  if (!this.maxUses) return 0;
  return Math.round((this.currentUses / this.maxUses) * 100);
});

// Method to check if customer can use coupon
CouponSchema.methods.canCustomerUse = function (customerId: string): boolean {
  if (!this.isCurrentlyValid) return false;

  const customerUsage = this.usedBy.filter(
    (usage: any) => usage.customerId.toString() === customerId,
  ).length;

  return customerUsage < (this.maxUsesPerCustomer || 1);
};

// Method to check if coupon applies to booking
CouponSchema.methods.appliesToBooking = function (booking: any): {
  valid: boolean;
  reason?: string;
} {
  // Check vendor restriction
  if (
    this.vendorId &&
    this.vendorId.toString() !== booking.vendorId.toString()
  ) {
    return { valid: false, reason: "Coupon not valid for this vendor" };
  }

  // Check service category restriction
  if (this.serviceCategories && this.serviceCategories.length > 0) {
    const serviceCategory = booking.service?.category;
    if (!this.serviceCategories.includes(serviceCategory)) {
      return {
        valid: false,
        reason: "Coupon not valid for this service category",
      };
    }
  }

  // Check specific service restriction
  if (this.serviceIds && this.serviceIds.length > 0) {
    if (!this.serviceIds.includes(booking.serviceId.toString())) {
      return { valid: false, reason: "Coupon not valid for this service" };
    }
  }

  // Check minimum amount
  if (this.minimumAmount && booking.totalPrice < this.minimumAmount) {
    return {
      valid: false,
      reason: `Minimum booking amount is $${this.minimumAmount / 100}`,
    };
  }

  // Check day of week
  if (this.daysOfWeek && this.daysOfWeek.length > 0) {
    const bookingDay = new Date(booking.datetime).getDay();
    if (!this.daysOfWeek.includes(bookingDay)) {
      return { valid: false, reason: "Coupon not valid for this day" };
    }
  }

  // Check time slots
  if (this.timeSlots && this.timeSlots.length > 0) {
    const bookingTime = new Date(booking.datetime)
      .toTimeString()
      .substring(0, 5);
    const isValidTime = this.timeSlots.some(
      (slot: any) => bookingTime >= slot.start && bookingTime <= slot.end,
    );
    if (!isValidTime) {
      return { valid: false, reason: "Coupon not valid for this time" };
    }
  }

  return { valid: true };
};

// Method to calculate discount amount
CouponSchema.methods.calculateDiscount = function (
  bookingAmount: number,
): number {
  let discount = 0;

  switch (this.type) {
    case "percentage":
      discount = Math.round((bookingAmount * this.value) / 100);
      break;
    case "fixed_amount":
      discount = Math.min(this.value, bookingAmount);
      break;
    case "free_service":
      discount = bookingAmount;
      break;
  }

  // Apply maximum discount limit for percentage coupons
  if (this.type === "percentage" && this.maximumDiscount) {
    discount = Math.min(discount, this.maximumDiscount);
  }

  return discount;
};

export default mongoose.models.Coupon ||
  mongoose.model<ICoupon>("Coupon", CouponSchema);
