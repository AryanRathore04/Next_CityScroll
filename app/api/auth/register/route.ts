import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  createRefreshTokenCookie,
} from "@/lib/auth";
import { withRateLimit } from "@/lib/middleware";
import {
  registerSchema,
  validateInput,
  sanitizeObject,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

async function registerHandler(request: Request) {
  console.log("🔵 [REGISTER] Starting registration process...");
  try {
    // Read raw body and parse safely to handle PowerShell/curl quoting issues
    const rawBody = await request.text();
    console.log(
      "🔵 [REGISTER] Raw request body received:",
      rawBody ? "[DATA PRESENT]" : "[EMPTY BODY]",
    );
    let requestData: any = {};
    try {
      requestData = rawBody ? JSON.parse(rawBody) : {};
      console.log(
        "🔵 [REGISTER] JSON parsing successful. Fields received:",
        Object.keys(requestData),
      );
    } catch (parseError) {
      console.error("🔴 [REGISTER] JSON parsing failed:", parseError);
      console.warn(
        "[auth/register] Failed to parse JSON body. Raw body:",
        rawBody,
      );
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const sanitizedData = sanitizeObject(requestData);

    // Validate input
    console.log("🔵 [REGISTER] Starting input validation...");
    const validation = validateInput(registerSchema, sanitizedData);
    if (!validation.success) {
      console.error("🔴 [REGISTER] Validation failed:", validation.error);
      return NextResponse.json(
        { error: "Validation failed", message: validation.error },
        { status: 400 },
      );
    }
    console.log("🟢 [REGISTER] Input validation successful");

    const { email, password, userType, firstName, lastName, businessName } =
      validation.data;

    console.log("🔵 [REGISTER] Registration data:", {
      email: email.toLowerCase(),
      userType,
      firstName,
      lastName,
      businessName: businessName || "N/A",
      hasPassword: !!password,
    });

    // No test-user shortcuts here; always persist to the database.

    // Connect to database with error handling
    console.log("🔵 [REGISTER] Connecting to database...");
    try {
      await connectDB();
      console.log("🟢 [REGISTER] Database connection established");
    } catch (dbError) {
      console.error("🔴 [REGISTER] Database connection failed:", dbError);
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

    // Check if user already exists
    console.log(
      "🔵 [REGISTER] Checking for existing user with email:",
      email.toLowerCase(),
    );
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log("🔴 [REGISTER] User already exists with this email");
      return NextResponse.json(
        {
          error: "Registration failed. Please try again.", // Generic message to prevent enumeration
          code: "REGISTRATION_FAILED",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }
    console.log(
      "🟢 [REGISTER] Email available, proceeding with user creation...",
    );

    // Hash password
    console.log("🔵 [REGISTER] Hashing password...");
    const hashedPassword = await hashPassword(password);
    console.log("🟢 [REGISTER] Password hashed successfully");

    // Create user
    const userDataToCreate = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      userType,
      businessName: userType === "vendor" ? businessName : undefined,
      verified: false,
      status: userType === "vendor" ? "pending_approval" : "active",
    };
    console.log("🔵 [REGISTER] Creating new user in database...", {
      email: userDataToCreate.email,
      userType: userDataToCreate.userType,
      status: userDataToCreate.status,
    });

    const newUser = await User.create(userDataToCreate);
    console.log(
      "🟢 [REGISTER] User created successfully with ID:",
      newUser._id.toString(),
    );

    // Generate tokens
    const payload = {
      id: newUser._id.toString(),
      email: newUser.email,
      userType: newUser.userType,
    };
    console.log(
      "🔵 [REGISTER] Generating access and refresh tokens for user:",
      newUser._id.toString(),
    );
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    console.log("🟢 [REGISTER] Tokens generated successfully");

    // Save refresh token to user record
    console.log("🔵 [REGISTER] Saving refresh token to user record...");
    newUser.refreshToken = refreshToken;
    await newUser.save();
    console.log("🟢 [REGISTER] Refresh token saved to database");

    // Create HttpOnly cookie for refresh token
    console.log("🔵 [REGISTER] Creating HttpOnly refresh token cookie...");
    const refreshCookie = createRefreshTokenCookie(refreshToken);

    // Return success without sensitive information
    const safeUser = newUser.toSafeObject();
    console.log("🔵 [REGISTER] Preparing successful response for user:", {
      userId: safeUser._id,
      email: safeUser.email,
      userType: safeUser.userType,
      status: safeUser.status,
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: safeUser._id,
          email: safeUser.email,
          userType: safeUser.userType,
          firstName: safeUser.firstName,
          lastName: safeUser.lastName,
          businessName: safeUser.businessName,
          status: safeUser.status,
        },
        accessToken,
        message: "Registration successful",
      },
      {
        status: 201,
        headers: { "Set-Cookie": refreshCookie },
      },
    );

    console.log(
      "🟢 [REGISTER] Registration completed successfully for:",
      safeUser.email,
    );
    return response;
  } catch (error: any) {
    console.error("🔴 [REGISTER] Registration error occurred:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    console.error("Registration error:", error);

    // Return generic error message to prevent user enumeration
    let errorMessage = "Registration failed. Please try again.";
    let statusCode = 400;

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error (email already exists)
      errorMessage = "Registration failed. Please try again."; // Don't reveal that email exists
      statusCode = 400;
    } else if (error.name === "ValidationError") {
      errorMessage = "Invalid request format";
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
