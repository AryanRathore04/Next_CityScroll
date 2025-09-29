import { NextRequest, NextResponse } from "next/server";
import { GeolocationService } from "@/lib/geolocation-service";
import { serverLogger as logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceCategory = searchParams.get("category") || undefined;

    const results = await GeolocationService.getPopularAreas(serviceCategory);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error("Error getting popular areas", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get popular areas",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
