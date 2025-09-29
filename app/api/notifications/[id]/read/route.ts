import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { NotificationService } from "@/lib/notification-service";
import { serverLogger as logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const notification = await NotificationService.markAsRead(
      params.id,
      user.id,
    );

    logger.info("Notification marked as read", {
      notificationId: params.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    const params = await context.params;
    logger.error("Error marking notification as read", {
      notificationId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}
