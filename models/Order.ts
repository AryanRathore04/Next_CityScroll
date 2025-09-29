import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  _id: string;
  bookingId: string;
  customerId: string;
  vendorId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: "created" | "paid" | "failed" | "refunded";
  paymentMethod?: string;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    bookingId: {
      type: String,
      required: true,
      ref: "Booking",
      unique: true, // One order per booking
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
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be positive"],
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR"],
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true, // Allow multiple null values but unique non-null values
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },
    paymentMethod: {
      type: String,
      maxlength: 50,
    },
    failureReason: {
      type: String,
      maxlength: 500,
    },
    refundId: {
      type: String,
      sparse: true,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for faster queries
OrderSchema.index({ bookingId: 1 });
OrderSchema.index({ customerId: 1, status: 1 });
OrderSchema.index({ vendorId: 1, status: 1 });
OrderSchema.index({ razorpayOrderId: 1 });
OrderSchema.index({ razorpayPaymentId: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// Virtual to populate booking info
OrderSchema.virtual("booking", {
  ref: "Booking",
  localField: "bookingId",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate customer info
OrderSchema.virtual("customer", {
  ref: "User",
  localField: "customerId",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate vendor info
OrderSchema.virtual("vendor", {
  ref: "User",
  localField: "vendorId",
  foreignField: "_id",
  justOne: true,
});

// Method to check if order can be refunded
OrderSchema.methods.canBeRefunded = function (): boolean {
  return this.status === "paid" && !this.refundId;
};

// Method to get safe order data (without sensitive payment info)
OrderSchema.methods.toSafeObject = function () {
  const { razorpaySignature, ...safeOrder } = this.toObject();
  return safeOrder;
};

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
