import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string; // hashed
  userType: "customer" | "vendor" | "admin";
  businessName?: string;
  businessType?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  location?: {
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  verified: boolean;
  status: "active" | "pending_approval" | "approved" | "rejected" | "suspended";
  rating?: number;
  totalBookings?: number;
  profileImage?: string;
  description?: string;
  refreshToken?: string; // store latest refresh token for validation and revocation
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    userType: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },
    businessName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    businessType: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    businessAddress: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, trim: true, maxlength: 50 },
      state: { type: String, trim: true, maxlength: 50 },
      zipCode: { type: String, trim: true, maxlength: 10 },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    location: {
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "pending_approval", "approved", "rejected", "suspended"],
      default: "active",
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    profileImage: String,
    description: {
      type: String,
      maxlength: 1000,
    },
    refreshToken: {
      type: String,
      select: false, // exclude from queries by default for security
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Enhanced indexes for better query performance
UserSchema.index({ email: 1 }, { unique: true }); // Unique email index for fast auth lookups
UserSchema.index({ email: 1, userType: 1 }); // Compound for auth queries
UserSchema.index({ userType: 1, status: 1 }); // Compound for filtering active vendors/customers
UserSchema.index({ "businessAddress.city": 1, userType: 1, status: 1 }); // Location-based vendor search
UserSchema.index({ "businessAddress.coordinates": "2dsphere" }); // Geospatial index for location queries
UserSchema.index({ status: 1 }); // Quick status filtering
UserSchema.index({ createdAt: -1 }); // Recent users
UserSchema.index({ rating: -1 }); // Top-rated vendors
UserSchema.index({ businessName: "text", firstName: "text", lastName: "text" }); // Text search

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook for logging
UserSchema.pre("save", function (next) {
  console.log("🔵 [USER MODEL] Pre-save hook triggered for user:", {
    isNew: this.isNew,
    email: this.email,
    userType: this.userType,
    modifiedPaths: this.modifiedPaths(),
  });

  if (this.isNew) {
    console.log("🔵 [USER MODEL] Creating new user with data:", {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      userType: this.userType,
      businessName: this.businessName,
      status: this.status,
    });
  }
  next();
});

// Post-save hook for logging
UserSchema.post("save", function (doc) {
  console.log("🟢 [USER MODEL] User saved successfully:", {
    userId: doc._id.toString(),
    email: doc.email,
    userType: doc.userType,
    status: doc.status,
    isNew: doc.isNew,
  });
});

// Pre-findOne hook for logging
UserSchema.pre("findOne", function () {
  console.log("🔵 [USER MODEL] findOne query:", this.getQuery());
});

// Post-findOne hook for logging
UserSchema.post("findOne", function (doc) {
  if (doc) {
    console.log("🟢 [USER MODEL] findOne result found:", {
      userId: doc._id.toString(),
      email: doc.email,
      userType: doc.userType,
    });
  } else {
    console.log("🔴 [USER MODEL] findOne result: no user found");
  }
});

// Method to get safe user data (without password)
UserSchema.methods.toSafeObject = function () {
  const { password, ...safeUser } = this.toObject();
  return safeUser;
};

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
