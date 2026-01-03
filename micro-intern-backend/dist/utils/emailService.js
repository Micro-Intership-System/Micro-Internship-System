"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendBulkEmail = sendBulkEmail;
const email_1 = require("../config/email");
/**
 * Send an email
 */
async function sendEmail(to, template) {
    try {
        const transporter = (0, email_1.getTransporter)();
        const mailOptions = {
            from: (0, email_1.getFromEmail)(),
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
    }
    catch (error) {
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
async function sendBulkEmail(recipients, template) {
    const results = await Promise.allSettled(recipients.map((to) => sendEmail(to, template)));
    let success = 0;
    let failed = 0;
    const errors = [];
    results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.success) {
            success++;
        }
        else {
            failed++;
            const error = result.status === "rejected"
                ? result.reason?.message || "Unknown error"
                : result.value.error || "Failed to send";
            errors.push(`${recipients[index]}: ${error}`);
        }
    });
    return { success, failed, errors };
}
