import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  _id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  isActive: boolean;
  images?: string[];
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    vendorId: {
      type: String,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 15, // minimum 15 minutes
      max: 480, // maximum 8 hours
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        type: String,
      },
    ],
    features: [
      {
        type: String,
        maxlength: 100,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Enhanced indexes for service discovery and management
ServiceSchema.index({ vendorId: 1, isActive: 1, category: 1 }); // Vendor service management
ServiceSchema.index({ category: 1, isActive: 1, price: 1 }); // Category browsing with price sort
ServiceSchema.index({ isActive: 1, price: 1 }); // Price-based filtering
ServiceSchema.index({ name: "text", description: "text", category: "text" }); // Text search
ServiceSchema.index({ vendorId: 1, createdAt: -1 }); // Recent services by vendor
ServiceSchema.index({ price: 1 }); // Price range queries
ServiceSchema.index({ duration: 1 }); // Duration-based filtering

// Virtual to populate vendor info
ServiceSchema.virtual("vendor", {
  ref: "User",
  localField: "vendorId",
  foreignField: "_id",
  justOne: true,
});

export default mongoose.models.Service ||
  mongoose.model<IService>("Service", ServiceSchema);
