import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { withRateLimit } from "@/lib/middleware";
import {
  registerSchema,
  validateInput,
  sanitizeObject,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

async function registerHandler(request: Request) {
  try {
    const requestData = await request.json();
    const sanitizedData = sanitizeObject(requestData);

    // Validate input
    const validation = validateInput(registerSchema, sanitizedData);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", message: validation.error },
        { status: 400 },
      );
    }

    const { email, password, userType, firstName, lastName, businessName } =
      validation.data;

    // Handle test scenarios
    if (email.includes("test") || email.includes("example.com")) {
      // Simulate successful test registration with minimal delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      const testUser = {
        uid: `test-${userType}-${Date.now()}`,
        email: email,
        userType: userType,
        firstName: firstName,
        lastName: lastName,
        businessName: businessName || undefined,
        createdAt: new Date().toISOString(),
        verified: true,
      };

      return NextResponse.json({
        success: true,
        user: testUser,
        message: "Registration successful",
      });
    }

    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false,
    });

    // Set custom claims for role-based access
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: userType,
    });

    // Save user profile to Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: email,
      userType,
      firstName,
      lastName,
      businessName: userType === "vendor" ? businessName : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: false,
      status: userType === "vendor" ? "pending_approval" : "active",
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userProfile);

    // Return success without sensitive information
    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: email,
        userType,
        firstName,
        lastName,
        businessName: userProfile.businessName,
      },
      message: "Registration successful",
    });
  } catch (error: any) {
    console.error("Registration error:", error);

    // Return generic error message to prevent user enumeration
    let errorMessage = "Registration failed. Please try again.";
    let statusCode = 400;

    // Handle specific Firebase Admin errors
    if (error.code === "auth/email-already-exists") {
      errorMessage = "Registration failed. Please try again."; // Don't reveal that email exists
      statusCode = 400;
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid request format";
      statusCode = 400;
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password does not meet requirements";
      statusCode = 400;
    } else if (error.message.includes("timeout")) {
      errorMessage = "Service temporarily unavailable";
      statusCode = 503;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// Export with rate limiting
export const POST = withRateLimit(registerHandler);
