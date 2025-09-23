import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  createRefreshTokenCookie,
} from "@/lib/auth";
import { withRateLimit } from "@/lib/middleware";
import { signinSchema, validateInput, sanitizeObject } from "@/lib/validation";

export const dynamic = "force-dynamic";

async function signinHandler(request: Request) {
  try {
    // Read raw body and parse safely to handle PowerShell/curl quoting issues
    const rawBody = await request.text();
    let requestData: any = {};
    try {
      requestData = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseError) {
      console.warn(
        "[auth/signin] Failed to parse JSON body. Raw body:",
        rawBody,
      );
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const sanitizedData = sanitizeObject(requestData);

    // Validate input
    const validation = validateInput(signinSchema, sanitizedData);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid credentials" }, // Generic message
        { status: 401 },
      );
    }

    const { email, password } = validation.data;

    // No test-user shortcuts here; always validate against the database.

    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Find user by email (include refreshToken field for update)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+refreshToken",
    );
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Check if user account is active
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Account suspended. Please contact support." },
        { status: 403 },
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      userType: user.userType,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token to user record
    user.refreshToken = refreshToken;
    await user.save();

    // Create HttpOnly cookie for refresh token
    const refreshCookie = createRefreshTokenCookie(refreshToken);

    // Return success without sensitive information
    const safeUser = {
      id: user._id.toString(),
      email: user.email,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      status: user.status,
      verified: user.verified,
    };

    return NextResponse.json(
      {
        success: true,
        user: safeUser,
        accessToken,
        message: "Sign in successful",
      },
      {
        headers: { "Set-Cookie": refreshCookie },
      },
    );
  } catch (error: any) {
    console.error("Authentication error:", error);

    // Return generic error message to prevent user enumeration
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 401 },
    );
  }
}

// Export with rate limiting
export const POST = withRateLimit(signinHandler);
