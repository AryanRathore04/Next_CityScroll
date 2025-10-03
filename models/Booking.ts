import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  _id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  staffId?: string; // Optional staff member assigned to booking
  staffPreference?: "any" | "specific";
  datetime: Date;
  duration: number; // Duration in minutes (copied from service)
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  totalPrice: number;
  notes?: string;
  customerNotes?: string;
  vendorNotes?: string;
  paymentStatus: "pending" | "paid" | "refunded" | "refund_pending";
  paymentMethod?: string;
  reminderSent?: boolean;
  cancelledAt?: Date; // When booking was cancelled
  cancelledBy?: string; // User ID who cancelled
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
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
    staffId: {
      type: String,
      ref: "Staff",
      sparse: true, // Allow multiple null values
    },
    staffPreference: {
      type: String,
      enum: ["any", "specific"],
      default: "any",
    },
    datetime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 15, // Minimum 15 minutes
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no_show"],
      default: "pending",
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    customerNotes: {
      type: String,
      maxlength: 500,
    },
    vendorNotes: {
      type: String,
      maxlength: 500,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "refund_pending"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      maxlength: 50,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: String,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Enhanced indexes for optimal query performance
BookingSchema.index({ customerId: 1, status: 1, datetime: -1 }); // Customer booking history
BookingSchema.index({ vendorId: 1, datetime: 1 }); // Vendor schedule view
BookingSchema.index({ vendorId: 1, status: 1, datetime: -1 }); // Vendor booking management
BookingSchema.index({ serviceId: 1, datetime: 1 }); // Service popularity analytics
BookingSchema.index({ datetime: 1, status: 1 }); // Daily booking reports
BookingSchema.index({ paymentStatus: 1, status: 1 }); // Payment reconciliation
BookingSchema.index({ status: 1, createdAt: -1 }); // Recent bookings by status
BookingSchema.index(
  {
    vendorId: 1,
    datetime: 1,
    status: 1,
  },
  {
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed"] },
    },
  },
); // Active bookings for availability calculation

// Virtual to populate customer info
BookingSchema.virtual("customer", {
  ref: "User",
  localField: "customerId",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate vendor info
BookingSchema.virtual("vendor", {
  ref: "User",
  localField: "vendorId",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate service info
BookingSchema.virtual("service", {
  ref: "Service",
  localField: "serviceId",
  foreignField: "_id",
  justOne: true,
});

export default mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
