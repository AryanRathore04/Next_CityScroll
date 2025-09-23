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
  try {
    // Read raw body and parse safely to handle PowerShell/curl quoting issues
    const rawBody = await request.text();
    let requestData: any = {};
    try {
      requestData = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseError) {
      console.warn(
        "[auth/register] Failed to parse JSON body. Raw body:",
        rawBody,
      );
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
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

    // No test-user shortcuts here; always persist to the database.

    // Connect to database
    await connectDB();
    const User = (await import("../../../../models/User")).default;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Registration failed. Please try again." }, // Generic message to prevent enumeration
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      userType,
      businessName: userType === "vendor" ? businessName : undefined,
      verified: false,
      status: userType === "vendor" ? "pending_approval" : "active",
    });

    // Generate tokens
    const payload = {
      id: newUser._id.toString(),
      email: newUser.email,
      userType: newUser.userType,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token to user record
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // Create HttpOnly cookie for refresh token
    const refreshCookie = createRefreshTokenCookie(refreshToken);

    // Return success without sensitive information
    const safeUser = newUser.toSafeObject();

    return NextResponse.json(
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
  } catch (error: any) {
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
