import nodemailer from "nodemailer";
import { serverLogger as logger } from "./logger";

// Email configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@beautybook.com";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }
  return transporter;
}

// Email Templates
const emailTemplates = {
  vendorApproval: (vendorName: string, businessName: string) => ({
    subject: "🎉 Your BeautyBook Vendor Account Has Been Approved!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white !important;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background: #5568d3;
            }
            .info-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
            .steps {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .step {
              display: flex;
              margin: 15px 0;
              align-items: flex-start;
            }
            .step-number {
              background: #667eea;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              margin-right: 15px;
              flex-shrink: 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your vendor account has been approved</p>
          </div>
          
          <div class="content">
            <p>Dear ${vendorName},</p>
            
            <p>Great news! Your vendor application for <strong>${businessName}</strong> has been approved by our admin team.</p>
            
            <div class="info-box">
              <p style="margin: 0; font-weight: 600;">✅ Your account is now active and ready to use!</p>
            </div>

            <p>You can now access your vendor dashboard and start managing your business on BeautyBook.</p>

            <div style="text-align: center;">
              <a href="${APP_URL}/vendor-dashboard" class="button">
                Access Your Dashboard
              </a>
            </div>

            <div class="steps">
              <h3 style="margin-top: 0;">What's Next?</h3>
              
              <div class="step">
                <div class="step-number">1</div>
                <div>
                  <strong>Complete Your Onboarding</strong>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">Set up your business profile, add services, and upload images</p>
                </div>
              </div>

              <div class="step">
                <div class="step-number">2</div>
                <div>
                  <strong>Add Your Staff</strong>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">Create staff profiles and assign services to team members</p>
                </div>
              </div>

              <div class="step">
                <div class="step-number">3</div>
                <div>
                  <strong>Start Accepting Bookings</strong>
                  <p style="margin: 5px 0 0 0; color: #6b7280;">Your business will be visible to customers ready to book</p>
                </div>
              </div>
            </div>

            <p>If you have any questions or need assistance, our support team is here to help at <a href="mailto:support@beautybook.com">support@beautybook.com</a>.</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The BeautyBook Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} BeautyBook. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Congratulations, ${vendorName}!

Your vendor application for ${businessName} has been approved by our admin team.

Your account is now active and ready to use!

Access your dashboard: ${APP_URL}/vendor-dashboard

What's Next?
1. Complete Your Onboarding - Set up your business profile, add services, and upload images
2. Add Your Staff - Create staff profiles and assign services to team members
3. Start Accepting Bookings - Your business will be visible to customers ready to book

If you have any questions, contact us at support@beautybook.com.

Best regards,
The BeautyBook Team
    `,
  }),

  vendorRejection: (
    vendorName: string,
    businessName: string,
    reason?: string,
  ) => ({
    subject: "Update on Your BeautyBook Vendor Application",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #ef4444;
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: #fef2f2;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #ef4444;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Application Status Update</h1>
          </div>
          
          <div class="content">
            <p>Dear ${vendorName},</p>
            
            <p>Thank you for your interest in joining BeautyBook as a vendor.</p>
            
            <div class="info-box">
              <p style="margin: 0;">Unfortunately, we are unable to approve your vendor application for <strong>${businessName}</strong> at this time.</p>
            </div>

            ${
              reason
                ? `
              <p><strong>Reason:</strong><br>${reason}</p>
            `
                : ""
            }

            <p>If you believe this decision was made in error or if you'd like to discuss your application further, please don't hesitate to contact our support team at <a href="mailto:support@beautybook.com">support@beautybook.com</a>.</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The BeautyBook Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} BeautyBook. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Dear ${vendorName},

Thank you for your interest in joining BeautyBook as a vendor.

Unfortunately, we are unable to approve your vendor application for ${businessName} at this time.

${reason ? `Reason: ${reason}` : ""}

If you believe this decision was made in error or if you'd like to discuss your application, please contact us at support@beautybook.com.

Best regards,
The BeautyBook Team
    `,
  }),
};

// Send vendor approval email
export async function sendVendorApprovalEmail(
  vendorEmail: string,
  vendorName: string,
  businessName: string,
): Promise<boolean> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn("SMTP not configured, skipping email send", {
        vendorEmail,
        action: "vendor_approval",
      });
      console.log(
        "⚠️ [EMAIL] SMTP not configured - email would be sent to:",
        vendorEmail,
      );
      console.log(
        "📧 [EMAIL] Subject:",
        emailTemplates.vendorApproval(vendorName, businessName).subject,
      );
      return true; // Return true so it doesn't block the approval process
    }

    const template = emailTemplates.vendorApproval(vendorName, businessName);

    const mailOptions = {
      from: `"BeautyBook" <${FROM_EMAIL}>`,
      to: vendorEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    logger.info("Sending vendor approval email", {
      to: vendorEmail,
      businessName,
    });

    await getTransporter().sendMail(mailOptions);

    logger.info("Vendor approval email sent successfully", {
      to: vendorEmail,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send vendor approval email", {
      error,
      vendorEmail,
    });
    console.error("❌ [EMAIL] Failed to send approval email:", error);
    // Don't throw - we don't want email failures to block approval
    return false;
  }
}

// Send vendor rejection email
export async function sendVendorRejectionEmail(
  vendorEmail: string,
  vendorName: string,
  businessName: string,
  reason?: string,
): Promise<boolean> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn("SMTP not configured, skipping email send", {
        vendorEmail,
        action: "vendor_rejection",
      });
      console.log(
        "⚠️ [EMAIL] SMTP not configured - email would be sent to:",
        vendorEmail,
      );
      return true;
    }

    const template = emailTemplates.vendorRejection(
      vendorName,
      businessName,
      reason,
    );

    const mailOptions = {
      from: `"BeautyBook" <${FROM_EMAIL}>`,
      to: vendorEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    logger.info("Sending vendor rejection email", {
      to: vendorEmail,
      businessName,
    });

    await getTransporter().sendMail(mailOptions);

    logger.info("Vendor rejection email sent successfully", {
      to: vendorEmail,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send vendor rejection email", {
      error,
      vendorEmail,
    });
    console.error("❌ [EMAIL] Failed to send rejection email:", error);
    return false;
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("⚠️ SMTP not configured");
      return false;
    }

    await getTransporter().verify();
    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return false;
  }
}
