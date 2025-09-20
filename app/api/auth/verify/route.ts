import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { withRateLimit } from "@/lib/middleware";

export const dynamic = "force-dynamic";

async function verifyTokenHandler(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 },
      );
    }

    const idToken = authHeader.substring(7);

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Get user profile from Firestore
    const userDoc = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    const userProfile = userDoc.data();

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Return user information
    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || userProfile.userType || "customer",
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        businessName: userProfile.businessName,
        verified: decodedToken.email_verified,
        status: userProfile.status,
      },
    });
  } catch (error: any) {
    console.error("Token verification error:", error);

    if (error.code === "auth/id-token-expired") {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    if (error.code === "auth/id-token-revoked") {
      return NextResponse.json({ error: "Token revoked" }, { status: 401 });
    }

    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

// Export with rate limiting
export const POST = withRateLimit(verifyTokenHandler);
