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
      // Gmail configuration - only create if credentials are present
      if (!process.env.EMAIL_USER || (!process.env.EMAIL_PASSWORD && !process.env.EMAIL_APP_PASSWORD)) {
        console.warn("⚠️ Gmail service configured but credentials missing. Using mock transporter.");
        transporterInstance = nodemailer.createTransport({
          streamTransport: true,
          newline: "unix",
          buffer: true,
        });
        return transporterInstance;
      }
      
      transporterInstance = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD, // Use App Password for Gmail
        },
        // Add connection timeout to prevent hanging
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
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
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn("⚠️ SMTP service configured but credentials missing. Using mock transporter.");
        transporterInstance = nodemailer.createTransport({
          streamTransport: true,
          newline: "unix",
          buffer: true,
        });
        return transporterInstance;
      }
      
      transporterInstance = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        // Add connection timeout to prevent hanging
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
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

// Verify email configuration (lazy - only called when needed)
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    // Skip verification if email is not configured
    if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVICE) {
      return false;
    }
    
    const transporter = getEmailTransporter();
    
    // Set a timeout for verification (5 seconds)
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Email verification timeout")), 5000)
    );
    
    await Promise.race([verifyPromise, timeoutPromise]);
    console.log("✅ Email service configured successfully");
    return true;
  } catch (error: any) {
    // Don't log as error - just warn, as email might not be critical
    console.warn("⚠️ Email service verification failed:", error.message || error);
    return false;
  }
}


