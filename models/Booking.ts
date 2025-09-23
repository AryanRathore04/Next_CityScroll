import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  _id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  datetime: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  totalPrice: number;
  notes?: string;
  customerNotes?: string;
  vendorNotes?: string;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod?: string;
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
    datetime: {
      type: Date,
      required: true,
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
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      maxlength: 50,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for faster queries
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ vendorId: 1 });
BookingSchema.index({ serviceId: 1 });
BookingSchema.index({ datetime: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });

// Compound indexes for common queries
BookingSchema.index({ vendorId: 1, datetime: 1 });
BookingSchema.index({ customerId: 1, status: 1 });

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
