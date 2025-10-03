import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";

// Dynamic import to avoid compilation issues
const getVendorVerificationModel = async () => {
  const { default: VendorVerification } = await import(
    "@/models/VendorVerification"
  );
  return VendorVerification;
};

// POST /api/vendor/verification/documents - Upload verification document
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Only allow vendors to upload documents
    if (user.userType !== "vendor") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Only vendors can upload documents.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { documentType, fileName, fileUrl, expiryDate } = body;

    // Validate required fields
    if (!documentType || !fileName || !fileUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: documentType, fileName, fileUrl",
        },
        { status: 400 },
      );
    }

    // Validate document type
    const validDocumentTypes = [
      "business_license",
      "tax_certificate",
      "insurance_policy",
      "identity_proof",
      "address_proof",
      "professional_certification",
      "health_permit",
      "other",
    ];

    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid document type" },
        { status: 400 },
      );
    }

    await connectDB();
    const VendorVerification = await getVendorVerificationModel();

    // Find vendor verification
    const verification = await VendorVerification.findOne({
      vendorId: user.id,
    });
    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Verification application not found. Please create an application first.",
        },
        { status: 404 },
      );
    }

    // Remove existing document of the same type if exists
    verification.documents = verification.documents.filter(
      (doc: any) => doc.type !== documentType,
    );

    // Add new document
    const newDocument = {
      type: documentType,
      fileName,
      fileUrl,
      uploadedAt: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      verified: false,
    };

    verification.documents.push(newDocument);
    await verification.save();

    // Check if all required documents are uploaded
    const uploadedTypes = verification.documents.map((doc: any) => doc.type);
    const allRequiredUploaded = verification.requiredDocuments.every(
      (req: any) => uploadedTypes.includes(req),
    );

    let statusChanged = false;
    if (allRequiredUploaded && verification.status === "pending") {
      verification.status = "under_review";
      await verification.save();
      statusChanged = true;

      // Send notification that application is now under review
      try {
        const { NotificationService } = await import(
          "@/lib/notification-service"
        );
        await NotificationService.createNotification({
          recipientId: user.id,
          type: "vendor_verification_under_review",
          title: "Application Under Review",
          message:
            "All required documents have been uploaded. Your application is now under review.",
          channels: ["email", "in_app"],
          data: {
            verificationId: verification._id.toString(),
          },
        });
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        verification,
        statusChanged,
      },
      message: statusChanged
        ? "Document uploaded successfully. Your application is now under review."
        : "Document uploaded successfully.",
    });
  } catch (error) {
    console.error("Error uploading verification document:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/vendor/verification/documents - Get verification documents
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Only allow vendors to view their documents
    if (user.userType !== "vendor") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    await connectDB();
    const VendorVerification = await getVendorVerificationModel();

    const verification = await VendorVerification.findOne({
      vendorId: user.id,
    });
    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Verification application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        documents: verification.documents,
        requiredDocuments: verification.requiredDocuments,
        status: verification.status,
      },
    });
  } catch (error) {
    console.error("Error fetching verification documents:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
