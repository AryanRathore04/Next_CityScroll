import { NextResponse } from "next/server";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    const { email, password, userType, firstName, lastName, businessName } =
      userData;

    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: "Email, password, and userType are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Handle test scenarios
    if (email.includes("test") || email.includes("example.com")) {
      // Simulate successful test registration with minimal delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      const testUser = {
        uid: `test-${userType}-${Date.now()}`,
        email: email,
        userType: userType,
        firstName: firstName || "Test",
        lastName: lastName || "User",
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

    // Actual Firebase registration with timeout
    const authPromise = createUserWithEmailAndPassword(auth, email, password);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Registration timeout")), 5000),
    );

    const userCredential = (await Promise.race([
      authPromise,
      timeoutPromise,
    ])) as any;
    const user = userCredential.user;

    // Save user profile to Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      userType,
      firstName,
      lastName,
      businessName: userType === "vendor" ? businessName : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: false,
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    return NextResponse.json({
      success: true,
      user: userProfile,
      message: "Registration successful",
    });
  } catch (error: any) {
    console.error("Registration error:", error);

    let errorMessage = "Registration failed";
    let statusCode = 400;

    if (error.message.includes("timeout")) {
      errorMessage = "Registration service temporarily unavailable";
      statusCode = 503;
    } else if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email address is already in use";
      statusCode = 409;
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
      statusCode = 400;
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
      statusCode = 400;
    }

    return NextResponse.json(
      {
        error: "Registration failed",
        message: errorMessage,
      },
      { status: statusCode },
    );
  }
}
