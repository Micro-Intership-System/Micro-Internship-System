import { getTransporter, getFromEmail } from "../config/email";
import { EmailTemplate } from "./emailTemplates";

/**
 * Send an email
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: getFromEmail(),
      to,
      subject: template.subject,
      html: template.html,
      text: template.text || template.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    // If using streamTransport (mock), log the email
    if (process.env.EMAIL_HOST === undefined && process.env.EMAIL_SERVICE === undefined) {
      console.log("📧 [MOCK EMAIL] Would send email to:", to);
      console.log("📧 [MOCK EMAIL] Subject:", template.subject);
      return { success: true, messageId: "mock-" + Date.now() };
    }

    console.log("✅ Email sent successfully to:", to, "Message ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Email send error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Send email to multiple recipients
 */
export async function sendBulkEmail(
  recipients: string[],
  template: EmailTemplate
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(
    recipients.map((to) => sendEmail(to, template))
  );

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.success) {
      success++;
    } else {
      failed++;
      const error = result.status === "rejected" 
        ? result.reason?.message || "Unknown error"
        : result.value.error || "Failed to send";
      errors.push(`${recipients[index]}: ${error}`);
    }
  });

  return { success, failed, errors };
}


