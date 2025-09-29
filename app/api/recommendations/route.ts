import { NextRequest, NextResponse } from "next/server";
import {
  AIRecommendationService,
  type RecommendationContext,
} from "@/lib/ai-recommendation-service";
import { serverLogger as logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      currentLocation,
      sessionType,
      occasion,
      timeframe,
      limit = 10,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const context: RecommendationContext = {
      userId,
      currentLocation,
      sessionType,
      occasion,
      timeframe,
    };

    const recommendations =
      await AIRecommendationService.getPersonalizedRecommendations(
        context,
        limit,
      );

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        context,
        total: recommendations.length,
      },
    });
  } catch (error) {
    logger.error("Error generating AI recommendations", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate recommendations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const context: RecommendationContext = {
      userId,
      currentLocation:
        lat && lng
          ? {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
            }
          : undefined,
    };

    const recommendations =
      await AIRecommendationService.getPersonalizedRecommendations(
        context,
        limit,
      );

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
      },
    });
  } catch (error) {
    logger.error("Error getting AI recommendations", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get recommendations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
