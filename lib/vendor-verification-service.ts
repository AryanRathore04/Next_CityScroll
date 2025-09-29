import VendorVerification, {
  IVendorVerification,
  VerificationStatus,
  VerificationDocumentType,
  VerificationDocument,
  ReviewFeedback,
} from "@/models/VendorVerification";
import { NotificationService } from "./notification-service";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export class VendorVerificationService {
  private notificationService = NotificationService;

  /**
   * Create a new vendor verification application
   */
  async createVerificationApplication(
    vendorId: string,
    applicationData: {
      businessName: string;
      businessType: string;
      businessAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country?: string;
      };
      contactPerson: {
        name: string;
        title: string;
        phone: string;
        email: string;
      };
      businessDetails?: {
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
    },
  ): Promise<IVendorVerification> {
    try {
      await connectDB();

      // Check if verification already exists
      const existingVerification = await VendorVerification.findOne({
        vendorId,
      });
      if (existingVerification) {
        throw new Error("Vendor verification application already exists");
      }

      // Get required documents based on business type
      const requiredDocuments = (
        VendorVerification as any
      ).getVerificationRequirements(applicationData.businessType);

      // Create verification application
      const verification = new VendorVerification({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        ...applicationData,
        requiredDocuments,
        status: "pending",
        submittedAt: new Date(),
        compliance: {
          healthAndSafety: false,
          insurance: false,
          licensing: false,
          taxation: false,
          lastUpdated: new Date(),
        },
        metrics: {
          totalBookings: 0,
          successfulBookings: 0,
          cancellationRate: 0,
          averageRating: 0,
          customerComplaintCount: 0,
        },
      });

      await verification.save();

      // Send notification to vendor
      await NotificationService.createNotification({
        recipientId: vendorId,
        type: "vendor_verification_started",
        title: "Verification Application Submitted",
        message: `Your verification application for ${applicationData.businessName} has been submitted and is under review.`,
        channels: ["email", "in_app"],
        data: {
          verificationId: verification._id.toString(),
          businessName: applicationData.businessName,
        },
      });

      return verification;
    } catch (error) {
      console.error("Error creating verification application:", error);
      throw error;
    }
  }

  /**
   * Upload verification document
   */
  async uploadDocument(
    vendorId: string,
    documentType: VerificationDocumentType,
    fileName: string,
    fileUrl: string,
    expiryDate?: Date,
  ): Promise<IVendorVerification> {
    try {
      await connectDB();

      const verification = await VendorVerification.findOne({ vendorId });
      if (!verification) {
        throw new Error("Verification application not found");
      }

      // Remove existing document of the same type if exists
      verification.documents = verification.documents.filter(
        (doc: any) => doc.type !== documentType,
      );

      // Add new document
      const newDocument: VerificationDocument = {
        type: documentType,
        fileName,
        fileUrl,
        uploadedAt: new Date(),
        expiryDate,
        verified: false,
      };

      verification.documents.push(newDocument);
      await verification.save();

      // Check if all required documents are uploaded
      const uploadedTypes = verification.documents.map((doc: any) => doc.type);
      const allRequiredUploaded = verification.requiredDocuments.every(
        (req: any) => uploadedTypes.includes(req),
      );

      if (allRequiredUploaded && verification.status === "pending") {
        verification.status = "under_review";
        await verification.save();

        // Notify vendor that application is now under review
        await NotificationService.createNotification({
          recipientId: vendorId,
          type: "vendor_verification_under_review",
          title: "Application Under Review",
          message:
            "All required documents have been uploaded. Your application is now under review.",
          channels: ["email", "in_app"],
          data: {
            verificationId: verification._id.toString(),
          },
        });
      }

      return verification;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }

  /**
   * Review verification application (admin function)
   */
  async reviewApplication(
    verificationId: string,
    reviewerId: string,
    reviewData: {
      status: VerificationStatus;
      comments?: string;
      documentsChecked: VerificationDocumentType[];
      verifiedDocuments?: VerificationDocumentType[];
      rejectedDocuments?: { type: VerificationDocumentType; reason: string }[];
      followUpRequired?: boolean;
      nextReviewDate?: Date;
    },
  ): Promise<IVendorVerification> {
    try {
      await connectDB();

      const verification = await VendorVerification.findById(verificationId);
      if (!verification) {
        throw new Error("Verification application not found");
      }

      // Update document verification status
      if (reviewData.verifiedDocuments) {
        reviewData.verifiedDocuments.forEach((docType) => {
          const document = verification.documents.find(
            (doc: any) => doc.type === docType,
          );
          if (document) {
            document.verified = true;
            document.verifiedAt = new Date();
            document.verifiedBy = new mongoose.Types.ObjectId(reviewerId);
          }
        });
      }

      if (reviewData.rejectedDocuments) {
        reviewData.rejectedDocuments.forEach(({ type, reason }) => {
          const document = verification.documents.find(
            (doc: any) => doc.type === type,
          );
          if (document) {
            document.verified = false;
            document.rejectionReason = reason;
          }
        });
      }

      // Add review to history
      const review: ReviewFeedback = {
        reviewer: new mongoose.Types.ObjectId(reviewerId),
        reviewedAt: new Date(),
        status: reviewData.status,
        comments: reviewData.comments,
        documentsChecked: reviewData.documentsChecked,
        followUpRequired: reviewData.followUpRequired,
        nextReviewDate: reviewData.nextReviewDate,
      };

      verification.reviewHistory.push(review);
      verification.status = reviewData.status;

      // Set verification details if approved
      if (reviewData.status === "approved") {
        verification.verifiedAt = new Date();
        verification.expiryDate = new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ); // 1 year from now
        verification.currentReviewer = undefined;

        // Update compliance based on verified documents
        const verifiedTypes = verification.documents
          .filter((doc: any) => doc.verified)
          .map((doc: any) => doc.type);

        verification.compliance = {
          healthAndSafety: verifiedTypes.includes("health_permit"),
          insurance: verifiedTypes.includes("insurance_policy"),
          licensing:
            verifiedTypes.includes("business_license") ||
            verifiedTypes.includes("professional_certification"),
          taxation: verifiedTypes.includes("tax_certificate"),
          lastUpdated: new Date(),
        };
      } else {
        verification.currentReviewer = new mongoose.Types.ObjectId(reviewerId);
      }

      await verification.save();

      // Send notification to vendor
      const notificationData: any = {
        recipientId: verification.vendorId.toString(),
        channels: ["email", "in_app"],
        data: {
          verificationId: verification._id.toString(),
          businessName: verification.businessName,
        },
      };

      switch (reviewData.status) {
        case "approved":
          notificationData.type = "vendor_verification_approved";
          notificationData.title = "Verification Approved!";
          notificationData.message = `Congratulations! Your business verification for ${verification.businessName} has been approved. You can now start receiving bookings.`;
          break;

        case "rejected":
          notificationData.type = "vendor_verification_rejected";
          notificationData.title = "Verification Rejected";
          notificationData.message = `Your verification application has been rejected. Please review the feedback and resubmit with corrected documents.`;
          if (reviewData.comments) {
            notificationData.data.rejectionReason = reviewData.comments;
          }
          break;

        case "under_review":
          if (reviewData.followUpRequired) {
            notificationData.type = "vendor_verification_followup";
            notificationData.title = "Additional Information Required";
            notificationData.message =
              "Additional documents or information are required for your verification. Please check your dashboard for details.";
          }
          break;
      }

      if (notificationData.type) {
        await this.notificationService.createNotification(notificationData);
      }

      return verification;
    } catch (error) {
      console.error("Error reviewing application:", error);
      throw error;
    }
  }

  /**
   * Get verification status for vendor
   */
  async getVerificationStatus(
    vendorId: string,
  ): Promise<IVendorVerification | null> {
    try {
      await connectDB();

      const verification = await VendorVerification.findOne({ vendorId })
        .populate("currentReviewer", "name email")
        .populate("reviewHistory.reviewer", "name email");

      return verification;
    } catch (error) {
      console.error("Error getting verification status:", error);
      throw error;
    }
  }

  /**
   * Get all verification applications for admin
   */
  async getVerificationApplications(
    filters: {
      status?: VerificationStatus[];
      businessType?: string;
      city?: string;
      state?: string;
      page?: number;
      limit?: number;
      sortBy?: "createdAt" | "submittedAt" | "verificationScore";
      sortOrder?: "asc" | "desc";
    } = {},
  ): Promise<{
    applications: IVendorVerification[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      await connectDB();

      const {
        status,
        businessType,
        city,
        state,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      // Build query
      const query: any = {};

      if (status && status.length > 0) {
        query.status = { $in: status };
      }

      if (businessType) {
        query.businessType = businessType;
      }

      if (city) {
        query["businessAddress.city"] = new RegExp(city, "i");
      }

      if (state) {
        query["businessAddress.state"] = state;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

      const [applications, total] = await Promise.all([
        VendorVerification.find(query)
          .populate("vendorId", "name email phone")
          .populate("currentReviewer", "name email")
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        VendorVerification.countDocuments(query),
      ]);

      return {
        applications,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error getting verification applications:", error);
      throw error;
    }
  }

  /**
   * Update vendor metrics (called from booking system)
   */
  async updateVendorMetrics(
    vendorId: string,
    metrics: {
      totalBookings?: number;
      successfulBookings?: number;
      averageRating?: number;
      customerComplaintCount?: number;
      lastBookingDate?: Date;
    },
  ): Promise<void> {
    try {
      await connectDB();

      const verification = await VendorVerification.findOne({ vendorId });
      if (!verification) {
        return; // No verification found, nothing to update
      }

      // Update metrics
      Object.assign(verification.metrics, metrics);

      // Recalculate cancellation rate if needed
      if (
        metrics.totalBookings !== undefined &&
        metrics.successfulBookings !== undefined
      ) {
        const canceledBookings =
          metrics.totalBookings - metrics.successfulBookings;
        verification.metrics.cancellationRate =
          metrics.totalBookings > 0
            ? (canceledBookings / metrics.totalBookings) * 100
            : 0;
      }

      await verification.save();
    } catch (error) {
      console.error("Error updating vendor metrics:", error);
      throw error;
    }
  }

  /**
   * Check for expiring verifications and send reminders
   */
  async checkExpiringVerifications(): Promise<void> {
    try {
      await connectDB();

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Find verifications expiring in 30 days
      const expiringSoon = await VendorVerification.find({
        status: "approved",
        expiryDate: {
          $lte: thirtyDaysFromNow,
          $gte: new Date(),
        },
      });

      // Find verifications expiring in 7 days
      const expiringUrgent = await VendorVerification.find({
        status: "approved",
        expiryDate: {
          $lte: sevenDaysFromNow,
          $gte: new Date(),
        },
      });

      // Send reminders
      for (const verification of expiringSoon) {
        const daysUntilExpiry = Math.ceil(
          (verification.expiryDate!.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        await this.notificationService.createNotification({
          recipientId: verification.vendorId.toString(),
          type: "vendor_verification_expiring",
          title: "Verification Renewal Required",
          message: `Your business verification expires in ${daysUntilExpiry} days. Please renew to continue receiving bookings.`,
          channels: ["email", "in_app"],
          data: {
            verificationId: verification._id.toString(),
            expiryDate: verification.expiryDate,
            daysUntilExpiry,
          },
        });
      }

      // Mark expired verifications
      await VendorVerification.updateMany(
        {
          status: "approved",
          expiryDate: { $lt: new Date() },
        },
        {
          $set: { status: "expired" },
        },
      );
    } catch (error) {
      console.error("Error checking expiring verifications:", error);
      throw error;
    }
  }
}
