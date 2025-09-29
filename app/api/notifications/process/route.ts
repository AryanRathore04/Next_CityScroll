import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware";
import { NotificationService } from "@/lib/notification-service";
import { serverLogger as logger } from "@/lib/logger";

// POST /api/notifications/process - Process pending notifications (admin/system only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Only admin can trigger notification processing
    if (user.userType !== "admin") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const result = await NotificationService.processPendingNotifications();

    logger.info("Notification processing triggered", {
      triggeredBy: user.id,
      processed: result.processed,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.processed} pending notifications`,
    });
  } catch (error) {
    logger.error("Error processing notifications", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: "Failed to process notifications" },
      { status: 500 },
    );
  }
}
