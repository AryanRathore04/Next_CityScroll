import { NextRequest, NextResponse } from "next/server";
import { GeolocationService } from "@/lib/geolocation-service";
import { serverLogger as logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/middleware";

async function searchSalonsHandler(request: NextRequest) {
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

    // Validate and limit pagination
    const MAX_LIMIT = 100;
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(limit) || 20),
    );

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
    const startIndex = (validatedPage - 1) * validatedLimit;
    const endIndex = startIndex + validatedLimit;
    const paginatedSalons = results.salons.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        salons: paginatedSalons,
        total: results.total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages: Math.ceil(results.total / validatedLimit),
      },
    });
  } catch (error) {
    logger.error("Error in salon search API", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search salons",
        message: error instanceof Error ? error.message : "Unknown error",
        code: "SEARCH_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Apply rate limiting: 30 requests per 15 minutes per IP
export const POST = withRateLimit(searchSalonsHandler, 900000, 30);
