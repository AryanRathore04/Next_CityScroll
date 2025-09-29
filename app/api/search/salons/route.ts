import { NextRequest, NextResponse } from "next/server";
import { GeolocationService } from "@/lib/geolocation-service";
import { serverLogger as logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      latitude,
      longitude,
      radius,
      city,
      state,
      zipCode,
      serviceCategory,
      priceRange,
      rating,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20,
    } = body;

    const filters = {
      latitude,
      longitude,
      radius,
      city,
      state,
      zipCode,
      serviceCategory,
      priceRange,
      rating,
      sortBy,
      sortOrder,
    };

    const results = await GeolocationService.searchSalons(filters);

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSalons = results.salons.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        salons: paginatedSalons,
        total: results.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(results.total / limit),
      },
    });
  } catch (error) {
    logger.error("Error in salon search API", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search salons",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
