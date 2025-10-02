import mongoose, { Schema, Document } from "mongoose";

// Transaction types
export type TransactionType =
  | "booking_payment" // Customer payment for booking
  | "commission_deduction" // Platform commission deducted
  | "vendor_payout" // Payment to vendor
  | "refund" // Refund to customer
  | "cancellation_fee" // Cancellation fee
  | "platform_fee" // Additional platform fees
  | "adjustment"; // Manual adjustment

// Transaction status
export type TransactionStatus =
  | "pending" // Transaction created but not processed
  | "processing" // Being processed
  | "completed" // Successfully completed
  | "failed" // Failed to process
  | "cancelled" // Cancelled
  | "refunded"; // Refunded

// Payment methods
export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "digital_wallet"
  | "cash"
  | "other";

// Payout methods
export type PayoutMethod =
  | "bank_account"
  | "digital_wallet"
  | "check"
  | "other";

export interface ITransaction extends Document {
  // Basic transaction info
  transactionId: string; // Unique identifier
  type: TransactionType;
  status: TransactionStatus;

  // Related entities
  bookingId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  payoutId?: mongoose.Types.ObjectId;

  // Financial details
  amount: number; // Total transaction amount
  platformCommission: number; // Commission taken by platform
  vendorAmount: number; // Amount for vendor
  currency: string; // Currency code (USD, EUR, etc.)

  // Payment details
  paymentMethod: PaymentMethod;
  paymentGateway?: string; // Stripe, Razorpay, etc.
  gatewayTransactionId?: string;
  gatewayFee?: number;

  // Processing details
  processedAt?: Date;
  failureReason?: string;
  retryCount: number;

  // Metadata
  description?: string;
  metadata?: Record<string, any>;

  // Audit trail
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// Commission configuration
export interface ICommissionConfig extends Document {
  vendorId: mongoose.Types.ObjectId;
  serviceCategory?: string; // Optional: different rates per service category

  // Commission structure
  commissionType: "percentage" | "flat_fee";
  commissionRate: number; // Percentage (0-100) or flat amount
  minimumCommission?: number;
  maximumCommission?: number;

  // Tiered commission based on volume
  tieredRates?: {
    minAmount: number;
    maxAmount: number;
    rate: number;
  }[];

  // Validity
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Payout tracking
export interface IPayout extends Document {
  payoutId: string;
  vendorId: mongoose.Types.ObjectId;

  // Payout details
  totalAmount: number;
  currency: string;
  payoutMethod: PayoutMethod;

  // Bank/wallet details
  accountDetails: {
    accountNumber?: string;
    routingNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    walletId?: string;
    walletType?: string;
  };

  // Transactions included in this payout
  transactionIds: mongoose.Types.ObjectId[];

  // Payout period
  periodStart: Date;
  periodEnd: Date;

  // Status and processing
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  processedAt?: Date;
  failureReason?: string;

  // Gateway details
  payoutGateway?: string;
  gatewayPayoutId?: string;
  gatewayFee?: number;

  // Metadata
  notes?: string;
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      },
    },

    type: {
      type: String,
      enum: [
        "booking_payment",
        "commission_deduction",
        "vendor_payout",
        "refund",
        "cancellation_fee",
        "platform_fee",
        "adjustment",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },

    // Related entities
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    vendorId: { type: Schema.Types.ObjectId, ref: "User" },
    payoutId: { type: Schema.Types.ObjectId, ref: "Payout" },

    // Financial details
    amount: { type: Number, required: true, min: 0 },
    platformCommission: { type: Number, default: 0, min: 0 },
    vendorAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD", required: true },

    // Payment details
    paymentMethod: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "bank_transfer",
        "digital_wallet",
        "cash",
        "other",
      ],
      required: true,
    },
    paymentGateway: { type: String },
    gatewayTransactionId: { type: String },
    gatewayFee: { type: Number, default: 0, min: 0 },

    // Processing details
    processedAt: { type: Date },
    failureReason: { type: String },
    retryCount: { type: Number, default: 0, min: 0 },

    // Metadata
    description: { type: String },
    metadata: { type: Schema.Types.Mixed },

    // Audit trail
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

const commissionConfigSchema = new Schema<ICommissionConfig>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceCategory: { type: String },

    commissionType: {
      type: String,
      enum: ["percentage", "flat_fee"],
      required: true,
    },
    commissionRate: { type: Number, required: true, min: 0 },
    minimumCommission: { type: Number, min: 0 },
    maximumCommission: { type: Number, min: 0 },

    tieredRates: [
      {
        minAmount: { type: Number, required: true, min: 0 },
        maxAmount: { type: Number, required: true, min: 0 },
        rate: { type: Number, required: true, min: 0 },
      },
    ],

    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

const payoutSchema = new Schema<IPayout>(
  {
    payoutId: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return `PAYOUT_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      },
    },

    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", required: true },

    payoutMethod: {
      type: String,
      enum: ["bank_account", "digital_wallet", "check", "other"],
      required: true,
    },

    accountDetails: {
      accountNumber: { type: String },
      routingNumber: { type: String },
      accountHolderName: { type: String },
      bankName: { type: String },
      walletId: { type: String },
      walletType: { type: String },
    },

    transactionIds: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],

    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },

    processedAt: { type: Date },
    failureReason: { type: String },

    payoutGateway: { type: String },
    gatewayPayoutId: { type: String },
    gatewayFee: { type: Number, default: 0, min: 0 },

    notes: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ vendorId: 1, status: 1 });
transactionSchema.index({ customerId: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ processedAt: -1 });
// Composite index for idempotency checks (Major Fix #15)
transactionSchema.index(
  { gatewayTransactionId: 1, bookingId: 1 },
  { unique: true, sparse: true },
);

commissionConfigSchema.index({ vendorId: 1, isActive: 1 });
commissionConfigSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

payoutSchema.index({ vendorId: 1, status: 1 });
payoutSchema.index({ payoutId: 1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });
payoutSchema.index({ createdAt: -1 });

// Virtual for net amount after commission
transactionSchema.virtual("netAmount").get(function (this: ITransaction) {
  return this.amount - this.platformCommission - (this.gatewayFee || 0);
});

// Virtual for commission percentage
transactionSchema
  .virtual("commissionPercentage")
  .get(function (this: ITransaction) {
    return this.amount > 0 ? (this.platformCommission / this.amount) * 100 : 0;
  });

// Instance methods
transactionSchema.methods.calculateCommission = function (
  this: ITransaction,
  commissionRate: number,
  commissionType: "percentage" | "flat_fee",
) {
  if (commissionType === "percentage") {
    return (this.amount * commissionRate) / 100;
  } else {
    return commissionRate;
  }
};

// Static methods
transactionSchema.statics.generateTransactionId = function () {
  return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

payoutSchema.statics.generatePayoutId = function () {
  return `PAYOUT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Pre-save middleware
transactionSchema.pre("save", function (this: ITransaction, next) {
  // Calculate vendor amount if not set
  if (
    this.isModified("amount") ||
    this.isModified("platformCommission") ||
    this.isModified("gatewayFee")
  ) {
    this.vendorAmount =
      this.amount - this.platformCommission - (this.gatewayFee || 0);
  }

  // Set processed date when status changes to completed
  if (
    this.isModified("status") &&
    this.status === "completed" &&
    !this.processedAt
  ) {
    this.processedAt = new Date();
  }

  next();
});

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);

const CommissionConfig =
  mongoose.models.CommissionConfig ||
  mongoose.model<ICommissionConfig>("CommissionConfig", commissionConfigSchema);

const Payout =
  mongoose.models.Payout || mongoose.model<IPayout>("Payout", payoutSchema);

export { Transaction, CommissionConfig, Payout };
export default Transaction;
