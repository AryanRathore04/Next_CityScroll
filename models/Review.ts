import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  _id: string;
  bookingId: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  rating: number; // 1-5 stars
  comment: string;
  photos?: string[]; // Array of photo URLs
  isAnonymous: boolean;
  status: "pending" | "published" | "hidden" | "flagged";

  // Vendor response
  vendorResponse?: {
    message: string;
    respondedAt: Date;
    respondedBy: string; // vendor user ID
  };

  // Moderation
  moderatedBy?: string;
  moderatedAt?: Date;
  moderationReason?: string;

  // Helpfulness tracking
  helpfulVotes: number;
  totalVotes: number;

  // Metadata
  isVerifiedBooking: boolean;
  reviewSource: "post_booking" | "manual" | "imported";

  createdAt: Date;
  updatedAt: Date;
}

// Interface for review aggregation
export interface IVendorReviewStats {
  vendorId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  lastUpdated: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    bookingId: {
      type: String,
      required: true,
      ref: "Booking",
    },
    customerId: {
      type: String,
      required: true,
      ref: "User",
    },
    vendorId: {
      type: String,
      required: true,
      ref: "User",
    },
    serviceId: {
      type: String,
      required: true,
      ref: "Service",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    photos: [
      {
        type: String,
        validate: {
          validator: function (url: string) {
            return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url);
          },
          message: "Invalid image URL format",
        },
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "published", "hidden", "flagged"],
      default: "published", // Auto-publish for now, can add moderation later
    },

    // Vendor response
    vendorResponse: {
      message: {
        type: String,
        maxlength: 500,
        trim: true,
      },
      respondedAt: Date,
      respondedBy: {
        type: String,
        ref: "User",
      },
    },

    // Moderation fields
    moderatedBy: {
      type: String,
      ref: "User",
    },
    moderatedAt: Date,
    moderationReason: {
      type: String,
      maxlength: 200,
    },

    // Helpfulness tracking
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Metadata
    isVerifiedBooking: {
      type: Boolean,
      default: true,
    },
    reviewSource: {
      type: String,
      enum: ["post_booking", "manual", "imported"],
      default: "post_booking",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Enhanced indexes for optimal query performance
ReviewSchema.index({ vendorId: 1, status: 1, createdAt: -1 }); // Vendor reviews listing
ReviewSchema.index({ customerId: 1, createdAt: -1 }); // Customer review history
ReviewSchema.index({ bookingId: 1 }, { unique: true }); // Ensure one review per booking
ReviewSchema.index({ rating: 1, status: 1 }); // Rating filtering
ReviewSchema.index({ status: 1, createdAt: -1 }); // Moderation queue
ReviewSchema.index({ vendorId: 1, rating: 1, status: 1 }); // Rating statistics
ReviewSchema.index({ serviceId: 1, rating: 1, status: 1 }); // Service-specific reviews

// Virtual for helpfulness percentage
ReviewSchema.virtual("helpfulPercentage").get(function (this: IReview) {
  return this.totalVotes > 0
    ? Math.round((this.helpfulVotes / this.totalVotes) * 100)
    : 0;
});

// Virtual to populate customer info (for non-anonymous reviews)
ReviewSchema.virtual("customer", {
  ref: "User",
  localField: "customerId",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate vendor info
ReviewSchema.virtual("vendor", {
  ref: "User",
  localField: "vendorId",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate service info
ReviewSchema.virtual("service", {
  ref: "Service",
  localField: "serviceId",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate booking info
ReviewSchema.virtual("booking", {
  ref: "Booking",
  localField: "bookingId",
  foreignField: "_id",
  justOne: true,
});

// Instance methods
ReviewSchema.methods.markAsHelpful = function (
  this: IReview,
  wasHelpful: boolean,
) {
  this.totalVotes += 1;
  if (wasHelpful) {
    this.helpfulVotes += 1;
  }
  return this.save();
};

ReviewSchema.methods.addVendorResponse = function (
  this: IReview,
  message: string,
  vendorId: string,
) {
  this.vendorResponse = {
    message: message,
    respondedAt: new Date(),
    respondedBy: vendorId,
  };
  return this.save();
};

ReviewSchema.methods.moderate = function (
  this: IReview,
  status: "hidden" | "flagged" | "published",
  moderatorId: string,
  reason?: string,
) {
  this.status = status;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  if (reason) {
    this.moderationReason = reason;
  }
  return this.save();
};

// Static methods
ReviewSchema.statics.getVendorStats = async function (
  vendorId: string,
): Promise<IVendorReviewStats> {
  const stats = await this.aggregate([
    {
      $match: {
        vendorId: vendorId,
        status: "published",
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        ratings: { $push: "$rating" },
      },
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: { $round: ["$averageRating", 1] },
        ratingDistribution: {
          5: {
            $size: {
              $filter: { input: "$ratings", cond: { $eq: ["$$this", 5] } },
            },
          },
          4: {
            $size: {
              $filter: { input: "$ratings", cond: { $eq: ["$$this", 4] } },
            },
          },
          3: {
            $size: {
              $filter: { input: "$ratings", cond: { $eq: ["$$this", 3] } },
            },
          },
          2: {
            $size: {
              $filter: { input: "$ratings", cond: { $eq: ["$$this", 2] } },
            },
          },
          1: {
            $size: {
              $filter: { input: "$ratings", cond: { $eq: ["$$this", 1] } },
            },
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      vendorId,
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      lastUpdated: new Date(),
    }
  );
};

ReviewSchema.statics.canUserReview = async function (
  customerId: string,
  bookingId: string,
): Promise<{ canReview: boolean; reason?: string }> {
  // Check if booking exists and belongs to customer
  const Booking = mongoose.model("Booking");
  const booking = await Booking.findOne({
    _id: bookingId,
    customerId: customerId,
    status: "completed", // Only allow reviews for completed bookings
  });

  if (!booking) {
    return { canReview: false, reason: "Booking not found or not completed" };
  }

  // Check if review already exists
  const existingReview = await this.findOne({ bookingId: bookingId });
  if (existingReview) {
    return {
      canReview: false,
      reason: "Review already submitted for this booking",
    };
  }

  return { canReview: true };
};

ReviewSchema.statics.getRecentReviews = function (limit: number = 10) {
  return this.find({ status: "published" })
    .populate("customer", "firstName lastName profileImage")
    .populate("vendor", "businessName")
    .populate("service", "name")
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Pre-save middleware
ReviewSchema.pre("save", function (this: IReview, next) {
  // Ensure rating is within bounds
  if (this.rating < 1) this.rating = 1;
  if (this.rating > 5) this.rating = 5;

  // Auto-verify if this comes from a completed booking
  if (this.isNew && this.reviewSource === "post_booking") {
    this.isVerifiedBooking = true;
  }

  next();
});

// Post-save middleware to update vendor rating
ReviewSchema.post("save", async function (this: IReview) {
  if (this.status === "published") {
    try {
      const User = mongoose.model("User");
      const stats = await (this.constructor as any).getVendorStats(
        this.vendorId,
      );

      await User.findByIdAndUpdate(this.vendorId, {
        rating: stats.averageRating,
        totalReviews: stats.totalReviews, // Assuming we add this field to User model
      });
    } catch (error) {
      console.error("Failed to update vendor rating:", error);
    }
  }
});

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);
