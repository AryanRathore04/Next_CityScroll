import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware";
import {
  AIRecommendationService,
  type RecommendationContext,
} from "@/lib/ai-recommendation-service";
import { serverLogger as logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      currentLocation,
      sessionType,
      occasion,
      timeframe,
      limit = 10,
    } = body;

    const context: RecommendationContext = {
      userId: user.id,
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

    logger.info("AI recommendations generated", {
      userId: user.id,
      count: recommendations.length,
      context: sessionType,
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        context,
        total: recommendations.length,
      },
    });
  } catch (error) {
    logger.error("Error generating AI recommendations", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

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
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const limit = parseInt(searchParams.get("limit") || "10");

    const context: RecommendationContext = {
      userId: user.id,
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

    logger.info("AI recommendations fetched", {
      userId: user.id,
      count: recommendations.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
      },
    });
  } catch (error) {
    logger.error("Error getting AI recommendations", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

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
