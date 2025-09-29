import { NextRequest, NextResponse } from "next/server";
import { GeolocationService } from "@/lib/geolocation-service";
import { serverLogger as logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: "Address is required",
        },
        { status: 400 },
      );
    }

    const coordinates = await GeolocationService.geocodeAddress(address);

    return NextResponse.json({
      success: true,
      data: {
        coordinates,
        address,
      },
    });
  } catch (error) {
    logger.error("Error in geocoding API", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to geocode address",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
