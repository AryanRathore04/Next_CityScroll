import nodemailer from "nodemailer";
import twilio from "twilio";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { serverLogger as logger } from "@/lib/logger";
import { format } from "date-fns";

// Email configuration
// nodemailer uses createTransport
const emailTransporter: any = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// SMS configuration
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export interface NotificationData {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  channels: Array<"email" | "sms" | "push" | "in_app">;
  data?: Record<string, any>;
  scheduledAt?: Date;
  emailSubject?: string;
  phoneNumber?: string;
}

export class NotificationService {
  /**
   * Create and optionally send a notification
   */
  static async createNotification(
    notificationData: NotificationData,
    sendImmediately = true,
  ) {
    try {
      await connectDB();

      // Get recipient details
      const recipient = await User.findById(notificationData.recipientId);
      if (!recipient) {
        throw new Error("Recipient not found");
      }

      // Create notification record
      const notification = new Notification({
        recipientId: notificationData.recipientId,
        recipientType: recipient.userType,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        channels: notificationData.channels,
        scheduledAt: notificationData.scheduledAt,
        emailDetails: notificationData.channels.includes("email")
          ? {
              subject: notificationData.emailSubject || notificationData.title,
              htmlContent: await this.generateEmailHTML(notificationData),
              textContent: notificationData.message,
            }
          : undefined,
        smsDetails: notificationData.channels.includes("sms")
          ? {
              phoneNumber: notificationData.phoneNumber || recipient.phone,
              message: notificationData.message,
            }
          : undefined,
        pushDetails: notificationData.channels.includes("push")
          ? {
              title: notificationData.title,
              body: notificationData.message,
              url: notificationData.data?.url,
            }
          : undefined,
      });

      await notification.save();

      if (sendImmediately && !notificationData.scheduledAt) {
        await this.sendNotification(notification._id.toString());
      }

      logger.info("Notification created", {
        notificationId: notification._id,
        recipientId: notificationData.recipientId,
        type: notificationData.type,
        channels: notificationData.channels,
      });

      return notification;
    } catch (error) {
      logger.error("Failed to create notification", {
        error: error instanceof Error ? error.message : String(error),
        recipientId: notificationData.recipientId,
        type: notificationData.type,
      });
      throw error;
    }
  }

  /**
   * Send a notification by ID
   */
  static async sendNotification(notificationId: string) {
    try {
      await connectDB();

      const notification = await Notification.findById(notificationId).populate(
        "recipientId",
        "email phone firstName lastName",
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (notification.status !== "pending") {
        logger.warn("Attempted to send non-pending notification", {
          notificationId,
          currentStatus: notification.status,
        });
        return;
      }

      const results = [];
      let hasError = false;
      let errorMessage = "";

      // Send via different channels
      for (const channel of notification.channels) {
        try {
          switch (channel) {
            case "email":
              if (notification.emailDetails && notification.recipientId.email) {
                await this.sendEmail(notification);
                results.push(
                  `email: sent to ${notification.recipientId.email}`,
                );
              }
              break;

            case "sms":
              if (
                notification.smsDetails &&
                notification.smsDetails.phoneNumber
              ) {
                await this.sendSMS(notification);
                results.push(
                  `sms: sent to ${notification.smsDetails.phoneNumber}`,
                );
              }
              break;

            case "push":
              // Push notification logic would go here
              // For now, just mark as sent
              results.push("push: sent (simulated)");
              break;

            case "in_app":
              // In-app notifications are stored in DB and shown in UI
              results.push("in_app: stored");
              break;
          }
        } catch (channelError) {
          hasError = true;
          const channelErrorMsg =
            channelError instanceof Error
              ? channelError.message
              : String(channelError);
          errorMessage += `${channel}: ${channelErrorMsg}; `;
          logger.error(`Failed to send ${channel} notification`, {
            notificationId,
            error: channelErrorMsg,
          });
        }
      }

      // Update notification status
      if (hasError) {
        await notification.markAsFailed(errorMessage);
      } else {
        await notification.markAsSent();
      }

      logger.info("Notification processing completed", {
        notificationId,
        results,
        hasError,
      });

      return {
        success: !hasError,
        results,
        error: hasError ? errorMessage : null,
      };
    } catch (error) {
      logger.error("Failed to send notification", {
        notificationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmail(notification: any) {
    if (!emailTransporter) {
      throw new Error("Email transporter not configured");
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || "noreply@cityscroll.com",
      to: notification.recipientId.email,
      subject: notification.emailDetails.subject,
      html: notification.emailDetails.htmlContent,
      text: notification.emailDetails.textContent,
    };

    await emailTransporter.sendMail(mailOptions);
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(notification: any) {
    if (!twilioClient) {
      throw new Error("Twilio client not configured");
    }

    await twilioClient.messages.create({
      body: notification.smsDetails.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: notification.smsDetails.phoneNumber,
    });
  }

  /**
   * Generate HTML content for email
   */
  private static async generateEmailHTML(
    data: NotificationData,
  ): Promise<string> {
    // Basic HTML template - can be enhanced with proper email templates
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${data.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CityScroll</h1>
            </div>
            <div class="content">
              <h2>${data.title}</h2>
              <p>${data.message}</p>
              ${
                data.data?.bookingId
                  ? `<p><strong>Booking ID:</strong> ${data.data.bookingId}</p>`
                  : ""
              }
              ${
                data.data?.url
                  ? `<p><a href="${data.data.url}" class="button">View Details</a></p>`
                  : ""
              }
            </div>
            <div class="footer">
              <p>This is an automated message from CityScroll. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send booking confirmation notification
   */
  static async sendBookingConfirmation(bookingId: string) {
    try {
      await connectDB();

      const booking = await Booking.findById(bookingId)
        .populate("customerId", "firstName lastName email phone")
        .populate("vendorId", "businessName email phone")
        .populate("serviceId", "name duration price")
        .populate("staffId", "name");

      if (!booking) {
        throw new Error("Booking not found");
      }

      const customer = booking.customerId;
      const vendor = booking.vendorId;
      const service = booking.serviceId;
      const staff = booking.staffId;

      const bookingDate = format(
        new Date(booking.datetime),
        "EEEE, MMMM d, yyyy",
      );
      const bookingTime = format(new Date(booking.datetime), "h:mm a");

      // Send to customer
      await this.createNotification({
        recipientId: customer._id,
        type: "booking_confirmation",
        title: "Booking Confirmed!",
        message: `Your booking for ${service.name} at ${
          vendor.businessName
        } on ${bookingDate} at ${bookingTime} has been confirmed.${
          staff ? ` Your service will be provided by ${staff.name}.` : ""
        }`,
        channels: ["email", "in_app"],
        emailSubject: "Booking Confirmation - CityScroll",
        data: {
          bookingId: booking._id,
          bookingDate,
          bookingTime,
          serviceName: service.name,
          vendorName: vendor.businessName,
          staffName: staff?.name,
          totalPrice: booking.totalPrice,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id}`,
        },
      });

      // Send to vendor
      await this.createNotification({
        recipientId: vendor._id,
        type: "booking_confirmation",
        title: "New Booking Received",
        message: `New booking from ${customer.firstName} ${
          customer.lastName
        } for ${service.name} on ${bookingDate} at ${bookingTime}.${
          staff ? ` Assigned to ${staff.name}.` : ""
        }`,
        channels: ["email", "in_app"],
        emailSubject: "New Booking - CityScroll",
        data: {
          bookingId: booking._id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          serviceName: service.name,
          bookingDate,
          bookingTime,
          staffName: staff?.name,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor-dashboard/bookings/${booking._id}`,
        },
      });

      logger.info("Booking confirmation notifications sent", {
        bookingId: booking._id,
        customerId: customer._id,
        vendorId: vendor._id,
      });
    } catch (error) {
      logger.error("Failed to send booking confirmation", {
        bookingId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Send booking reminder notification
   */
  static async sendBookingReminder(bookingId: string) {
    try {
      await connectDB();

      const booking = await Booking.findById(bookingId)
        .populate("customerId", "firstName lastName email phone")
        .populate("serviceId", "name duration")
        .populate("vendorId", "businessName address");

      if (!booking || booking.reminderSent) {
        return; // Already sent or booking not found
      }

      const customer = booking.customerId;
      const service = booking.serviceId;
      const vendor = booking.vendorId;

      const bookingDate = format(
        new Date(booking.datetime),
        "EEEE, MMMM d, yyyy",
      );
      const bookingTime = format(new Date(booking.datetime), "h:mm a");

      await this.createNotification({
        recipientId: customer._id,
        type: "booking_reminder",
        title: "Upcoming Appointment Reminder",
        message: `Reminder: You have an appointment for ${service.name} at ${vendor.businessName} tomorrow (${bookingDate}) at ${bookingTime}.`,
        channels: ["email", "sms", "in_app"],
        emailSubject: "Appointment Reminder - CityScroll",
        phoneNumber: customer.phone,
        data: {
          bookingId: booking._id,
          serviceName: service.name,
          vendorName: vendor.businessName,
          bookingDate,
          bookingTime,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking._id}`,
        },
      });

      // Mark reminder as sent
      booking.reminderSent = true;
      await booking.save();

      logger.info("Booking reminder sent", {
        bookingId: booking._id,
        customerId: customer._id,
      });
    } catch (error) {
      logger.error("Failed to send booking reminder", {
        bookingId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Process pending notifications (for cron job)
   */
  static async processPendingNotifications() {
    try {
      await connectDB();

      const pendingNotifications = await (
        Notification as any
      ).getPendingNotifications();

      logger.info(
        `Processing ${pendingNotifications.length} pending notifications`,
      );

      for (const notification of pendingNotifications) {
        try {
          await this.sendNotification(notification._id.toString());
        } catch (error) {
          logger.error("Failed to process notification", {
            notificationId: notification._id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return { processed: pendingNotifications.length };
    } catch (error) {
      logger.error("Failed to process pending notifications", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      types?: string[];
    } = {},
  ) {
    try {
      await connectDB();

      const notifications = await (Notification as any).getUserNotifications(
        userId,
        options,
      );
      const unreadCount = await Notification.countDocuments({
        recipientId: userId,
        status: { $ne: "read" },
      });

      return {
        notifications,
        unreadCount,
        page: options.page || 1,
        limit: options.limit || 20,
      };
    } catch (error) {
      logger.error("Failed to get user notifications", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      await connectDB();

      const notification = await Notification.findOne({
        _id: notificationId,
        recipientId: userId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      await notification.markAsRead();

      logger.info("Notification marked as read", {
        notificationId,
        userId,
      });

      return notification;
    } catch (error) {
      logger.error("Failed to mark notification as read", {
        notificationId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
