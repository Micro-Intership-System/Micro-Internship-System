import nodemailer from "nodemailer";

// Lazy initialization - only creates transporter when first accessed
let transporterInstance: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter {
  if (!transporterInstance) {
    // Check if email is configured
    if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVICE) {
      console.warn("⚠️ Email service not configured. Email functionality will be disabled.");
      // Create a mock transporter that logs emails instead of sending
      transporterInstance = nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
        buffer: true,
      });
      return transporterInstance;
    }

    // Configure transporter based on email service type
    if (process.env.EMAIL_SERVICE === "gmail") {
      // Gmail configuration
      transporterInstance = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD, // Use App Password for Gmail
        },
      });
    } else if (process.env.EMAIL_SERVICE === "sendgrid") {
      // SendGrid configuration
      transporterInstance = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (process.env.EMAIL_SERVICE === "resend") {
      // Resend configuration (using SMTP)
      transporterInstance = nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 587,
        secure: false,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      });
    } else {
      // Generic SMTP configuration
      transporterInstance = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }
  return transporterInstance;
}

export function getTransporter(): nodemailer.Transporter {
  return getEmailTransporter();
}

export function getFromEmail(): string {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@microintern.com";
}

export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log("✅ Email service configured successfully");
    return true;
  } catch (error) {
    console.error("❌ Email service configuration error:", error);
    return false;
  }
}


