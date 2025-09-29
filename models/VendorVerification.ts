import mongoose, { Schema, Document } from "mongoose";

// Document types for verification
export type VerificationDocumentType =
  | "business_license"
  | "tax_certificate"
  | "insurance_policy"
  | "identity_proof"
  | "address_proof"
  | "professional_certification"
  | "health_permit"
  | "other";

// Verification status
export type VerificationStatus =
  | "pending" // Submitted, awaiting review
  | "under_review" // Being reviewed by admin
  | "approved" // Verified and approved
  | "rejected" // Rejected with reasons
  | "expired" // Verification expired
  | "suspended"; // Temporarily suspended

// Document structure
export interface VerificationDocument {
  type: VerificationDocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  expiryDate?: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

// Review feedback
export interface ReviewFeedback {
  reviewer: mongoose.Types.ObjectId;
  reviewedAt: Date;
  status: VerificationStatus;
  comments?: string;
  documentsChecked: VerificationDocumentType[];
  followUpRequired?: boolean;
  nextReviewDate?: Date;
}

export interface IVendorVerification extends Document {
  vendorId: mongoose.Types.ObjectId;
  businessName: string;
  businessType: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Instance methods
  calculateVerificationScore(): number;

  // Contact information
  contactPerson: {
    name: string;
    title: string;
    phone: string;
    email: string;
  };

  // Business details
  businessDetails: {
    registrationNumber?: string;
    taxId?: string;
    yearEstablished?: number;
    employeeCount?: number;
    description?: string;
    website?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
  };

  // Documents
  documents: VerificationDocument[];
  requiredDocuments: VerificationDocumentType[];

  // Verification status and history
  status: VerificationStatus;
  submittedAt?: Date;
  reviewHistory: ReviewFeedback[];
  currentReviewer?: mongoose.Types.ObjectId;

  // Verification levels
  verificationLevel: "basic" | "standard" | "premium";
  verificationScore: number; // 0-100

  // Expiry and renewal
  verifiedAt?: Date;
  expiryDate?: Date;
  autoRenewal: boolean;

  // Flags and notes
  flagged: boolean;
  flagReason?: string;
  adminNotes?: string;

  // Compliance
  compliance: {
    healthAndSafety: boolean;
    insurance: boolean;
    licensing: boolean;
    taxation: boolean;
    lastUpdated: Date;
  };

  // Metrics
  metrics: {
    totalBookings: number;
    successfulBookings: number;
    cancellationRate: number;
    averageRating: number;
    customerComplaintCount: number;
    lastBookingDate?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const verificationDocumentSchema = new Schema<VerificationDocument>({
  type: {
    type: String,
    enum: [
      "business_license",
      "tax_certificate",
      "insurance_policy",
      "identity_proof",
      "address_proof",
      "professional_certification",
      "health_permit",
      "other",
    ],
    required: true,
  },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  rejectionReason: { type: String },
});

const reviewFeedbackSchema = new Schema<ReviewFeedback>({
  reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reviewedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: [
      "pending",
      "under_review",
      "approved",
      "rejected",
      "expired",
      "suspended",
    ],
    required: true,
  },
  comments: { type: String },
  documentsChecked: [
    {
      type: String,
      enum: [
        "business_license",
        "tax_certificate",
        "insurance_policy",
        "identity_proof",
        "address_proof",
        "professional_certification",
        "health_permit",
        "other",
      ],
    },
  ],
  followUpRequired: { type: Boolean, default: false },
  nextReviewDate: { type: Date },
});

const vendorVerificationSchema = new Schema<IVendorVerification>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    businessName: { type: String, required: true },
    businessType: { type: String, required: true },

    businessAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: "US" },
    },

    contactPerson: {
      name: { type: String, required: true },
      title: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },

    businessDetails: {
      registrationNumber: { type: String },
      taxId: { type: String },
      yearEstablished: { type: Number },
      employeeCount: { type: Number },
      description: { type: String },
      website: { type: String },
      socialMedia: {
        instagram: { type: String },
        facebook: { type: String },
        twitter: { type: String },
      },
    },

    documents: [verificationDocumentSchema],
    requiredDocuments: [
      {
        type: String,
        enum: [
          "business_license",
          "tax_certificate",
          "insurance_policy",
          "identity_proof",
          "address_proof",
          "professional_certification",
          "health_permit",
          "other",
        ],
      },
    ],

    status: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "expired",
        "suspended",
      ],
      default: "pending",
    },

    submittedAt: { type: Date },
    reviewHistory: [reviewFeedbackSchema],
    currentReviewer: { type: Schema.Types.ObjectId, ref: "User" },

    verificationLevel: {
      type: String,
      enum: ["basic", "standard", "premium"],
      default: "basic",
    },

    verificationScore: { type: Number, default: 0, min: 0, max: 100 },

    verifiedAt: { type: Date },
    expiryDate: { type: Date },
    autoRenewal: { type: Boolean, default: true },

    flagged: { type: Boolean, default: false },
    flagReason: { type: String },
    adminNotes: { type: String },

    compliance: {
      healthAndSafety: { type: Boolean, default: false },
      insurance: { type: Boolean, default: false },
      licensing: { type: Boolean, default: false },
      taxation: { type: Boolean, default: false },
      lastUpdated: { type: Date, default: Date.now },
    },

    metrics: {
      totalBookings: { type: Number, default: 0 },
      successfulBookings: { type: Number, default: 0 },
      cancellationRate: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      customerComplaintCount: { type: Number, default: 0 },
      lastBookingDate: { type: Date },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
vendorVerificationSchema.index({ vendorId: 1 });
vendorVerificationSchema.index({ status: 1 });
vendorVerificationSchema.index({ verificationLevel: 1 });
vendorVerificationSchema.index({ "businessAddress.city": 1 });
vendorVerificationSchema.index({ "businessAddress.state": 1 });
vendorVerificationSchema.index({ expiryDate: 1 });
vendorVerificationSchema.index({ createdAt: -1 });

// Virtual for completion percentage
vendorVerificationSchema
  .virtual("completionPercentage")
  .get(function (this: IVendorVerification) {
    const requiredCount = this.requiredDocuments.length;
    const uploadedCount = this.documents.filter((doc) => doc.verified).length;
    return requiredCount > 0
      ? Math.round((uploadedCount / requiredCount) * 100)
      : 0;
  });

// Virtual for days until expiry
vendorVerificationSchema
  .virtual("daysUntilExpiry")
  .get(function (this: IVendorVerification) {
    if (!this.expiryDate) return null;
    const now = new Date();
    const expiry = new Date(this.expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

// Instance methods
vendorVerificationSchema.methods.calculateVerificationScore = function (
  this: IVendorVerification,
) {
  let score = 0;

  // Base score for required documents
  const requiredDocuments = this.requiredDocuments.length;
  const verifiedDocuments = this.documents.filter((doc) => doc.verified).length;
  score += (verifiedDocuments / requiredDocuments) * 60; // 60% for documents

  // Business details completion (20%)
  let detailsCount = 0;
  const details = this.businessDetails;
  if (details.registrationNumber) detailsCount++;
  if (details.taxId) detailsCount++;
  if (details.yearEstablished) detailsCount++;
  if (details.description) detailsCount++;
  if (details.website) detailsCount++;

  score += (detailsCount / 5) * 20;

  // Performance metrics (20%)
  if (this.metrics.totalBookings > 0) {
    const successRate =
      this.metrics.successfulBookings / this.metrics.totalBookings;
    const ratingScore = this.metrics.averageRating / 5;
    const complaintPenalty = Math.max(
      0,
      1 - this.metrics.customerComplaintCount * 0.1,
    );

    score +=
      (successRate * 0.4 + ratingScore * 0.4 + complaintPenalty * 0.2) * 20;
  }

  return Math.min(100, Math.round(score));
};

// Static methods
vendorVerificationSchema.statics.getVerificationRequirements = function (
  businessType: string,
) {
  const baseRequirements: VerificationDocumentType[] = [
    "business_license",
    "identity_proof",
    "address_proof",
  ];

  switch (businessType.toLowerCase()) {
    case "salon":
    case "spa":
      return [
        ...baseRequirements,
        "health_permit",
        "professional_certification",
        "insurance_policy",
      ];
    case "barbershop":
      return [
        ...baseRequirements,
        "health_permit",
        "professional_certification",
      ];
    case "wellness_center":
      return [
        ...baseRequirements,
        "health_permit",
        "insurance_policy",
        "professional_certification",
      ];
    default:
      return [...baseRequirements, "tax_certificate"];
  }
};

// Pre-save middleware to update verification score
vendorVerificationSchema.pre(
  "save",
  function (this: IVendorVerification, next) {
    if (
      this.isModified("documents") ||
      this.isModified("businessDetails") ||
      this.isModified("metrics")
    ) {
      this.verificationScore = this.calculateVerificationScore();
    }
    next();
  },
);

const VendorVerification =
  mongoose.models.VendorVerification ||
  mongoose.model<IVendorVerification>(
    "VendorVerification",
    vendorVerificationSchema,
  );

export default VendorVerification;
