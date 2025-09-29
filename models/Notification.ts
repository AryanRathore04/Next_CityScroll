import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  _id: string;
  recipientId: string; // User ID
  recipientType: "customer" | "vendor" | "admin";
  type:
    | "booking_confirmation"
    | "booking_reminder"
    | "booking_cancellation"
    | "booking_status_update"
    | "payment_confirmation"
    | "staff_assignment"
    | "vendor_approval"
    | "system_announcement";
  title: string;
  message: string;
  data?: Record<string, any>; // Additional data (booking ID, etc.)
  channels: Array<"email" | "sms" | "push" | "in_app">;
  status: "pending" | "sent" | "delivered" | "failed" | "read";
  scheduledAt?: Date; // For scheduled notifications
  sentAt?: Date;
  readAt?: Date;
  emailDetails?: {
    subject: string;
    htmlContent: string;
    textContent: string;
  };
  smsDetails?: {
    phoneNumber: string;
    message: string;
  };
  pushDetails?: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
  };
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    recipientType: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "booking_confirmation",
        "booking_reminder",
        "booking_cancellation",
        "booking_status_update",
        "payment_confirmation",
        "staff_assignment",
        "vendor_approval",
        "system_announcement",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    channels: [
      {
        type: String,
        enum: ["email", "sms", "push", "in_app"],
      },
    ],
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "read"],
      default: "pending",
      index: true,
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    sentAt: Date,
    readAt: Date,
    emailDetails: {
      subject: String,
      htmlContent: String,
      textContent: String,
    },
    smsDetails: {
      phoneNumber: String,
      message: String,
    },
    pushDetails: {
      title: String,
      body: String,
      icon: String,
      url: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    lastAttemptAt: Date,
    errorMessage: String,
  },
  {
    timestamps: true,
    collection: "notifications",
  },
);

// Indexes for efficient querying
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, status: 1 });

// Instance methods
NotificationSchema.methods.markAsRead = function () {
  this.status = "read";
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsSent = function () {
  this.status = "sent";
  this.sentAt = new Date();
  return this.save();
};

NotificationSchema.methods.markAsFailed = function (errorMessage: string) {
  this.status = "failed";
  this.errorMessage = errorMessage;
  this.lastAttemptAt = new Date();
  this.retryCount += 1;
  return this.save();
};

NotificationSchema.methods.canRetry = function () {
  return this.retryCount < this.maxRetries && this.status === "failed";
};

// Static methods
NotificationSchema.statics.getPendingNotifications = function () {
  return this.find({
    status: "pending",
    $or: [
      { scheduledAt: { $exists: false } },
      { scheduledAt: { $lte: new Date() } },
    ],
  }).sort({ createdAt: 1 });
};

NotificationSchema.statics.getFailedRetryableNotifications = function () {
  return this.find({
    status: "failed",
    retryCount: { $lt: this.$where("this.maxRetries") },
  });
};

NotificationSchema.statics.getUserNotifications = function (
  userId: string,
  options: {
    limit?: number;
    page?: number;
    unreadOnly?: boolean;
    types?: string[];
  } = {},
) {
  const query: any = { recipientId: userId };

  if (options.unreadOnly) {
    query.status = { $ne: "read" };
  }

  if (options.types && options.types.length > 0) {
    query.type = { $in: options.types };
  }

  const limit = options.limit || 20;
  const page = options.page || 1;
  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
