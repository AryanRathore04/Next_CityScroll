import {
  Transaction,
  CommissionConfig,
  Payout,
  ITransaction,
  ICommissionConfig,
  IPayout,
} from "@/models/Transaction";
import { NotificationService } from "./notification-service";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { serverLogger as logger } from "@/lib/logger";

export class CommissionPayoutService {
  /**
   * Create a transaction for a booking payment
   */
  static async createBookingTransaction(bookingData: {
    bookingId: string;
    customerId: string;
    vendorId: string;
    amount: number;
    paymentMethod: string;
    paymentGateway?: string;
    gatewayTransactionId?: string;
    gatewayFee?: number;
    currency?: string;
  }): Promise<ITransaction> {
    try {
      await connectDB();

      // Get commission configuration for vendor
      const commissionConfig = await this.getActiveCommissionConfig(
        bookingData.vendorId,
      );

      // Calculate commission
      const platformCommission = this.calculateCommission(
        bookingData.amount,
        commissionConfig?.commissionRate || 10, // Default 10%
        commissionConfig?.commissionType || "percentage",
      );

      // Apply min/max commission limits
      let finalCommission = platformCommission;
      if (
        commissionConfig?.minimumCommission &&
        finalCommission < commissionConfig.minimumCommission
      ) {
        finalCommission = commissionConfig.minimumCommission;
      }
      if (
        commissionConfig?.maximumCommission &&
        finalCommission > commissionConfig.maximumCommission
      ) {
        finalCommission = commissionConfig.maximumCommission;
      }

      // Create transaction
      const transaction = new Transaction({
        type: "booking_payment",
        bookingId: new mongoose.Types.ObjectId(bookingData.bookingId),
        customerId: new mongoose.Types.ObjectId(bookingData.customerId),
        vendorId: new mongoose.Types.ObjectId(bookingData.vendorId),
        amount: bookingData.amount,
        platformCommission: finalCommission,
        currency: bookingData.currency || "USD",
        paymentMethod: bookingData.paymentMethod,
        paymentGateway: bookingData.paymentGateway,
        gatewayTransactionId: bookingData.gatewayTransactionId,
        gatewayFee: bookingData.gatewayFee || 0,
        status: "completed",
        processedAt: new Date(),
        description: `Payment for booking ${bookingData.bookingId}`,
      });

      await transaction.save();

      logger.info("Booking transaction created", {
        transactionId: transaction.transactionId,
        bookingId: bookingData.bookingId,
        amount: bookingData.amount,
        commission: finalCommission,
      });

      // Send notification to vendor
      try {
        await NotificationService.createNotification({
          recipientId: bookingData.vendorId,
          type: "payment_received",
          title: "Payment Received",
          message: `You received a payment of ${bookingData.currency} ${(
            bookingData.amount - finalCommission
          ).toFixed(2)} for booking ${bookingData.bookingId}`,
          channels: ["email", "in_app"],
          data: {
            transactionId: transaction.transactionId,
            bookingId: bookingData.bookingId,
            amount: bookingData.amount,
            vendorAmount: transaction.vendorAmount,
            commission: finalCommission,
          },
        });
      } catch (notificationError) {
        logger.error("Error sending payment notification", {
          error: notificationError,
        });
      }

      return transaction;
    } catch (error) {
      logger.error("Error creating booking transaction", {
        error,
        bookingData,
      });
      throw error;
    }
  }

  /**
   * Calculate commission amount
   */
  static calculateCommission(
    amount: number,
    rate: number,
    type: "percentage" | "flat_fee",
  ): number {
    if (type === "percentage") {
      return (amount * rate) / 100;
    } else {
      return rate;
    }
  }

  /**
   * Get active commission configuration for vendor
   */
  static async getActiveCommissionConfig(
    vendorId: string,
  ): Promise<ICommissionConfig | null> {
    try {
      await connectDB();

      const config = await CommissionConfig.findOne({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        isActive: true,
        effectiveFrom: { $lte: new Date() },
        $or: [
          { effectiveTo: { $exists: false } },
          { effectiveTo: null },
          { effectiveTo: { $gte: new Date() } },
        ],
      }).sort({ effectiveFrom: -1 });

      return config;
    } catch (error) {
      logger.error("Error fetching commission config", { error, vendorId });
      return null;
    }
  }

  /**
   * Create or update commission configuration
   */
  static async setCommissionConfig(configData: {
    vendorId: string;
    commissionType: "percentage" | "flat_fee";
    commissionRate: number;
    minimumCommission?: number;
    maximumCommission?: number;
    serviceCategory?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<ICommissionConfig> {
    try {
      await connectDB();

      // Deactivate existing configs
      await CommissionConfig.updateMany(
        {
          vendorId: new mongoose.Types.ObjectId(configData.vendorId),
          isActive: true,
        },
        {
          $set: {
            isActive: false,
            effectiveTo: new Date(),
          },
        },
      );

      // Create new configuration
      const config = new CommissionConfig({
        vendorId: new mongoose.Types.ObjectId(configData.vendorId),
        commissionType: configData.commissionType,
        commissionRate: configData.commissionRate,
        minimumCommission: configData.minimumCommission,
        maximumCommission: configData.maximumCommission,
        serviceCategory: configData.serviceCategory,
        effectiveFrom: configData.effectiveFrom || new Date(),
        effectiveTo: configData.effectiveTo,
        isActive: true,
      });

      await config.save();

      logger.info("Commission configuration updated", {
        vendorId: configData.vendorId,
        configId: config._id,
      });

      return config;
    } catch (error) {
      logger.error("Error setting commission config", { error, configData });
      throw error;
    }
  }

  /**
   * Calculate pending payout amount for vendor
   */
  static async calculatePendingPayout(vendorId: string): Promise<{
    totalAmount: number;
    transactionCount: number;
    transactions: ITransaction[];
  }> {
    try {
      await connectDB();

      // Find completed transactions that haven't been paid out
      const transactions = await Transaction.find({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        type: "booking_payment",
        status: "completed",
        payoutId: { $exists: false },
      });

      const totalAmount = transactions.reduce(
        (sum: number, txn: any) => sum + txn.vendorAmount,
        0,
      );

      return {
        totalAmount,
        transactionCount: transactions.length,
        transactions,
      };
    } catch (error) {
      logger.error("Error calculating pending payout", { error, vendorId });
      throw error;
    }
  }

  /**
   * Create payout for vendor
   */
  static async createPayout(payoutData: {
    vendorId: string;
    payoutMethod: string;
    accountDetails: {
      accountNumber?: string;
      routingNumber?: string;
      accountHolderName?: string;
      bankName?: string;
      walletId?: string;
      walletType?: string;
    };
    periodStart?: Date;
    periodEnd?: Date;
    notes?: string;
  }): Promise<IPayout> {
    try {
      await connectDB();

      // Calculate period if not provided
      const periodEnd = payoutData.periodEnd || new Date();
      const periodStart =
        payoutData.periodStart ||
        new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Get pending transactions for the period
      const transactions = await Transaction.find({
        vendorId: new mongoose.Types.ObjectId(payoutData.vendorId),
        type: "booking_payment",
        status: "completed",
        payoutId: { $exists: false },
        processedAt: {
          $gte: periodStart,
          $lte: periodEnd,
        },
      });

      if (transactions.length === 0) {
        throw new Error("No pending transactions found for payout period");
      }

      const totalAmount = transactions.reduce(
        (sum, txn) => sum + txn.vendorAmount,
        0,
      );

      // Create payout
      const payout = new Payout({
        vendorId: new mongoose.Types.ObjectId(payoutData.vendorId),
        totalAmount,
        payoutMethod: payoutData.payoutMethod,
        accountDetails: payoutData.accountDetails,
        transactionIds: transactions.map((txn: any) => txn._id),
        periodStart,
        periodEnd,
        status: "pending",
        notes: payoutData.notes,
      });

      await payout.save();

      // Update transactions with payout ID
      await Transaction.updateMany(
        { _id: { $in: transactions.map((txn: any) => txn._id) } },
        { $set: { payoutId: payout._id } },
      );

      logger.info("Payout created", {
        payoutId: payout.payoutId,
        vendorId: payoutData.vendorId,
        totalAmount,
        transactionCount: transactions.length,
      });

      // Send notification to vendor
      try {
        await NotificationService.createNotification({
          recipientId: payoutData.vendorId,
          type: "payout_created",
          title: "Payout Initiated",
          message: `Your payout of $${totalAmount.toFixed(
            2,
          )} has been initiated and will be processed shortly.`,
          channels: ["email", "in_app"],
          data: {
            payoutId: payout.payoutId,
            amount: totalAmount,
            transactionCount: transactions.length,
            periodStart,
            periodEnd,
          },
        });
      } catch (notificationError) {
        logger.error("Error sending payout notification", {
          error: notificationError,
        });
      }

      return payout;
    } catch (error) {
      logger.error("Error creating payout", { error, payoutData });
      throw error;
    }
  }

  /**
   * Process payout (mark as completed)
   */
  static async processPayout(
    payoutId: string,
    gatewayPayoutId?: string,
    gatewayFee?: number,
  ): Promise<IPayout> {
    try {
      await connectDB();

      const payout = await Payout.findById(payoutId);
      if (!payout) {
        throw new Error("Payout not found");
      }

      payout.status = "completed";
      payout.processedAt = new Date();
      if (gatewayPayoutId) payout.gatewayPayoutId = gatewayPayoutId;
      if (gatewayFee) payout.gatewayFee = gatewayFee;

      await payout.save();

      // Create payout transaction record
      const payoutTransaction = new Transaction({
        type: "vendor_payout",
        vendorId: payout.vendorId,
        payoutId: payout._id,
        amount: payout.totalAmount,
        platformCommission: 0,
        vendorAmount: payout.totalAmount - (gatewayFee || 0),
        currency: payout.currency,
        paymentMethod: payout.payoutMethod,
        gatewayFee: gatewayFee || 0,
        status: "completed",
        processedAt: new Date(),
        description: `Payout ${payout.payoutId}`,
      });

      await payoutTransaction.save();

      logger.info("Payout processed", {
        payoutId: payout.payoutId,
        amount: payout.totalAmount,
      });

      // Send notification
      try {
        await NotificationService.createNotification({
          recipientId: payout.vendorId.toString(),
          type: "payout_completed",
          title: "Payout Completed",
          message: `Your payout of $${payout.totalAmount.toFixed(
            2,
          )} has been processed successfully.`,
          channels: ["email", "in_app"],
          data: {
            payoutId: payout.payoutId,
            amount: payout.totalAmount,
            processedAt: payout.processedAt,
          },
        });
      } catch (notificationError) {
        logger.error("Error sending payout completion notification", {
          error: notificationError,
        });
      }

      return payout;
    } catch (error) {
      logger.error("Error processing payout", { error, payoutId });
      throw error;
    }
  }

  /**
   * Get vendor earnings summary
   */
  static async getVendorEarningsSummary(
    vendorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalEarnings: number;
    totalCommissions: number;
    totalPayouts: number;
    pendingAmount: number;
    transactionCount: number;
    averageTransactionAmount: number;
  }> {
    try {
      await connectDB();

      const matchFilter: any = {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        type: "booking_payment",
        status: "completed",
      };

      if (startDate || endDate) {
        matchFilter.processedAt = {};
        if (startDate) matchFilter.processedAt.$gte = startDate;
        if (endDate) matchFilter.processedAt.$lte = endDate;
      }

      const [summary] = await Transaction.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$vendorAmount" },
            totalCommissions: { $sum: "$platformCommission" },
            transactionCount: { $sum: 1 },
            averageAmount: { $avg: "$amount" },
          },
        },
      ]);

      // Get total payouts
      const payoutSummary = await Payout.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(vendorId),
            status: "completed",
            ...(startDate || endDate
              ? {
                  processedAt: {
                    ...(startDate && { $gte: startDate }),
                    ...(endDate && { $lte: endDate }),
                  },
                }
              : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalPayouts: { $sum: "$totalAmount" },
          },
        },
      ]);

      // Calculate pending amount
      const pendingResult = await this.calculatePendingPayout(vendorId);

      return {
        totalEarnings: summary?.totalEarnings || 0,
        totalCommissions: summary?.totalCommissions || 0,
        totalPayouts: payoutSummary[0]?.totalPayouts || 0,
        pendingAmount: pendingResult.totalAmount,
        transactionCount: summary?.transactionCount || 0,
        averageTransactionAmount: summary?.averageAmount || 0,
      };
    } catch (error) {
      logger.error("Error getting vendor earnings summary", {
        error,
        vendorId,
      });
      throw error;
    }
  }

  /**
   * Process automatic payouts (called by cron job)
   */
  static async processAutomaticPayouts(): Promise<void> {
    try {
      await connectDB();

      // Get vendors with pending payouts above minimum threshold
      const minimumPayoutAmount = 100; // $100 minimum

      const vendorsWithPendingPayouts = await Transaction.aggregate([
        {
          $match: {
            type: "booking_payment",
            status: "completed",
            payoutId: { $exists: false },
            processedAt: {
              $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            }, // 7 days old
          },
        },
        {
          $group: {
            _id: "$vendorId",
            totalAmount: { $sum: "$vendorAmount" },
            transactionCount: { $sum: 1 },
          },
        },
        {
          $match: {
            totalAmount: { $gte: minimumPayoutAmount },
          },
        },
      ]);

      logger.info(
        `Processing automatic payouts for ${vendorsWithPendingPayouts.length} vendors`,
      );

      for (const vendor of vendorsWithPendingPayouts) {
        try {
          // Get vendor payout preferences (you'd implement this)
          // For now, we'll skip auto-payout and just notify

          await NotificationService.createNotification({
            recipientId: vendor._id.toString(),
            type: "payout_available",
            title: "Payout Available",
            message: `You have $${vendor.totalAmount.toFixed(
              2,
            )} available for payout. Please set up your payout method to receive payments.`,
            channels: ["email", "in_app"],
            data: {
              amount: vendor.totalAmount,
              transactionCount: vendor.transactionCount,
            },
          });
        } catch (error) {
          logger.error("Error processing automatic payout for vendor", {
            error,
            vendorId: vendor._id,
          });
        }
      }
    } catch (error) {
      logger.error("Error processing automatic payouts", { error });
      throw error;
    }
  }
}
