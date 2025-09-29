import { NextRequest, NextResponse } from "next/server";
import { GeolocationService } from "@/lib/geolocation-service";
import { verifyAuth } from "@/lib/middleware";
import { serverLogger as logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ vendorId: string }> },
) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const radius = parseInt(searchParams.get("radius") || "10");

    // Next provides params as a Promise in the generated types
    const paramsObj = await context.params;
    const vendorId = paramsObj.vendorId;

    const results = await GeolocationService.getNearbyCustomers(
      vendorId,
      radius,
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error("Error getting nearby customers", {
      error,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get nearby customers",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
