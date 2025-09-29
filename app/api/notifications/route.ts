import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuth } from "@/lib/middleware";
import { NotificationService } from "@/lib/notification-service";
import { serverLogger as logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";

// GET /api/notifications - Get user notifications
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const types = searchParams.get("types")?.split(",").filter(Boolean) || [];

    const result = await NotificationService.getUserNotifications(user.id, {
      page,
      limit,
      unreadOnly,
      types: types.length > 0 ? types : undefined,
    });

    logger.info("User notifications retrieved", {
      userId: user.id,
      page,
      limit,
      count: result.notifications.length,
      unreadCount: result.unreadCount,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error retrieving notifications", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/notifications - Create notification (admin/system only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Only admin can create notifications via API
    if (user.userType !== "admin") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      recipientId,
      type,
      title,
      message,
      channels,
      data,
      scheduledAt,
      emailSubject,
      phoneNumber,
      sendImmediately = true,
    } = body;

    // Validate required fields
    if (!recipientId || !type || !title || !message || !channels) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const notification = await NotificationService.createNotification(
      {
        recipientId,
        type,
        title,
        message,
        channels,
        data,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        emailSubject,
        phoneNumber,
      },
      sendImmediately,
    );

    logger.info("Notification created via API", {
      notificationId: notification._id,
      createdBy: user.id,
      recipientId,
      type,
    });

    return NextResponse.json(
      {
        success: true,
        data: notification,
        message: "Notification created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Error creating notification", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 },
    );
  }
}
