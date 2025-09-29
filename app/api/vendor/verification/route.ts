import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";

// Dynamic import to avoid compilation issues
const getVendorVerificationModel = async () => {
  const { default: VendorVerification } = await import(
    "@/models/VendorVerification"
  );
  return VendorVerification;
};

// GET /api/vendor/verification - Get vendor verification status
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Only allow vendors and admins
    if (user.userType !== "vendor" && user.userType !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    await connectDB();
    const VendorVerification = await getVendorVerificationModel();

    let verification;

    if (user.userType === "admin") {
      // Admin can view all verifications
      const url = new URL(request.url);
      const vendorId = url.searchParams.get("vendorId");
      const status = url.searchParams.get("status");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "10");

      const query: any = {};

      if (vendorId) {
        query.vendorId = vendorId;
      }

      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const [verifications, total] = await Promise.all([
        VendorVerification.find(query)
          .populate("vendorId", "name email phone")
          .populate("currentReviewer", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        VendorVerification.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          verifications,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      // Vendor can only view their own verification
      verification = await VendorVerification.findOne({ vendorId: user.id })
        .populate("currentReviewer", "name email")
        .populate("reviewHistory.reviewer", "name email");

      return NextResponse.json({
        success: true,
        data: { verification },
      });
    }
  } catch (error) {
    console.error("Error fetching vendor verification:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/vendor/verification - Create or update vendor verification
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Only allow vendors to create verifications
    if (user.userType !== "vendor") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access denied. Only vendors can create verification applications.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      businessName,
      businessType,
      businessAddress,
      contactPerson,
      businessDetails = {},
    } = body;

    // Validate required fields
    if (!businessName || !businessType || !businessAddress || !contactPerson) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDB();
    const VendorVerification = await getVendorVerificationModel();

    // Check if verification already exists
    const existingVerification = await VendorVerification.findOne({
      vendorId: user.id,
    });
    if (existingVerification) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor verification application already exists",
        },
        { status: 409 },
      );
    }

    // Get required documents based on business type
    const getRequiredDocuments = (businessType: string) => {
      const baseRequirements = [
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

    const requiredDocuments = getRequiredDocuments(businessType);

    // Create verification application
    const verification = new VendorVerification({
      vendorId: user.id,
      businessName,
      businessType,
      businessAddress,
      contactPerson,
      businessDetails,
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

    // Send notification to vendor (simplified)
    try {
      const { NotificationService } = await import(
        "@/lib/notification-service"
      );
      await NotificationService.createNotification({
        recipientId: user.id,
        type: "vendor_verification_started",
        title: "Verification Application Submitted",
        message: `Your verification application for ${businessName} has been submitted and is under review.`,
        channels: ["email", "in_app"],
        data: {
          verificationId: verification._id.toString(),
          businessName,
        },
      });
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Continue without failing the main operation
    }

    return NextResponse.json({
      success: true,
      data: { verification },
      message: "Verification application submitted successfully",
    });
  } catch (error) {
    console.error("Error creating vendor verification:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
