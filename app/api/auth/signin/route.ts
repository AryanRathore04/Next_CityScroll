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
import { serverLogger as logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function signinHandler(request: Request) {
  console.log("🔵 [SIGNIN] Starting signin process...");
  try {
    // Read raw body and parse safely to handle PowerShell/curl quoting issues
    const rawBody = await request.text();
    console.log(
      "🔵 [SIGNIN] Raw request body received:",
      rawBody ? "[DATA PRESENT]" : "[EMPTY BODY]",
    );
    let requestData: any = {};
    try {
      requestData = rawBody ? JSON.parse(rawBody) : {};
      console.log(
        "🔵 [SIGNIN] JSON parsing successful. Fields received:",
        Object.keys(requestData),
      );
    } catch (parseError) {
      console.error("🔴 [SIGNIN] JSON parsing failed:", parseError);
      logger.warn("Failed to parse JSON body in signin", { rawBody });
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const sanitizedData = sanitizeObject(requestData);

    // Validate input
    console.log("🔵 [SIGNIN] Starting input validation...");
    const validation = validateInput(signinSchema, sanitizedData);
    if (!validation.success) {
      console.error("🔴 [SIGNIN] Validation failed:", validation.error);
      return NextResponse.json(
        { error: "Invalid credentials" }, // Generic message
        { status: 401 },
      );
    }
    console.log("🟢 [SIGNIN] Input validation successful");

    const { email, password } = validation.data;

    console.log("🔵 [SIGNIN] Signin attempt for email:", email.toLowerCase());

    // No test-user shortcuts here; always validate against the database.

    // Connect to database with error handling
    console.log("🔵 [SIGNIN] Connecting to database...");
    try {
      await connectDB();
      console.log("🟢 [SIGNIN] Database connection established");
    } catch (dbError) {
      console.error("🔴 [SIGNIN] Database connection failed:", dbError);
      logger.error("Database connection failed during signin", {
        error: dbError,
      });
      return NextResponse.json(
        {
          error: "Service temporarily unavailable",
          code: "DATABASE_CONNECTION_ERROR",
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }
    const User = (await import("../../../../models/User")).default;

    // Find user by email (include refreshToken field for update)
    console.log("🔵 [SIGNIN] Looking up user in database...");
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+refreshToken",
    );
    if (!user) {
      console.log("🔴 [SIGNIN] User not found for email:", email.toLowerCase());
      return NextResponse.json(
        {
          error: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }
    console.log("🟢 [SIGNIN] User found:", {
      userId: user._id.toString(),
      userType: user.userType,
      status: user.status,
    });

    // Check if user account is active
    if (user.status === "suspended") {
      console.log(
        "🔴 [SIGNIN] Account suspended for user:",
        user._id.toString(),
      );
      return NextResponse.json(
        { error: "Account suspended. Please contact support." },
        { status: 403 },
      );
    }

    // Verify password
    console.log("🔵 [SIGNIN] Verifying password...");
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log(
        "🔴 [SIGNIN] Invalid password for user:",
        user._id.toString(),
      );
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }
    console.log("🟢 [SIGNIN] Password verification successful");

    // Generate tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      userType: user.userType,
    };
    console.log("🔵 [SIGNIN] Generating tokens for user:", user._id.toString());
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    console.log("🟢 [SIGNIN] Tokens generated successfully");

    // Save refresh token to user record
    console.log("🔵 [SIGNIN] Saving refresh token to user record...");
    user.refreshToken = refreshToken;
    await user.save();
    console.log("🟢 [SIGNIN] Refresh token saved to database");

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

    console.log("🟢 [SIGNIN] Signin completed successfully for:", {
      userId: safeUser.id,
      email: safeUser.email,
      userType: safeUser.userType,
    });

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
    console.error("🔴 [SIGNIN] Authentication error occurred:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    logger.error("Authentication error", {
      error: error instanceof Error ? error.message : String(error),
    });

    // Return generic error message to prevent user enumeration
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 401 },
    );
  }
}

// Export with rate limiting
export const POST = withRateLimit(signinHandler);
