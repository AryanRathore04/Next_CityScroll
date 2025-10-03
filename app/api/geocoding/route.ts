import { NextRequest, NextResponse } from "next/server";
import { GeolocationService } from "@/lib/geolocation-service";
import { serverLogger as logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware";

async function geocodingHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Address is required",
          code: "MISSING_ADDRESS",
        },
        { status: 400 },
      );
    }

    // Validate address length
    if (typeof address !== "string" || address.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Address must be at least 3 characters long",
          code: "INVALID_ADDRESS",
        },
        { status: 400 },
      );
    }

    if (address.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Address is too long",
          code: "ADDRESS_TOO_LONG",
        },
        { status: 400 },
      );
    }

    const coordinates = await GeolocationService.geocodeAddress(address.trim());

    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not geocode the provided address",
          code: "GEOCODING_FAILED",
        },
        { status: 404 },
      );
    }

    logger.info("Address geocoded successfully", {
      address: address.trim(),
      coordinates,
    });

    return NextResponse.json({
      success: true,
      data: {
        coordinates,
        address: address.trim(),
      },
    });
  } catch (error) {
    logger.error("Error in geocoding API", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to geocode address",
        message: error instanceof Error ? error.message : "Unknown error",
        code: "GEOCODING_ERROR",
      },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(geocodingHandler);
