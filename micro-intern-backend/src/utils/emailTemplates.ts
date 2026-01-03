import { getFrontendUrl } from "../config/email";

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

/**
 * Password Reset Email Template
 */
export function passwordResetEmail(name: string, resetToken: string): EmailTemplate {
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;
  
  return {
    subject: "Reset Your Password - Micro Internship System",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your Micro Internship System account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Micro Internship System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${name},\n\nWe received a request to reset your password. Click this link to reset: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
  };
}

/**
 * Email Verification Template
 */
export function emailVerificationEmail(name: string, verificationToken: string): EmailTemplate {
  const verifyUrl = `${getFrontendUrl()}/verify-email?token=${verificationToken}`;
  
  return {
    subject: "Verify Your Email - Micro Internship System",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Welcome to Micro Internship System! Please verify your email address to complete your registration.</p>
            <a href="${verifyUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Micro Internship System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${name},\n\nWelcome! Please verify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  };
}

/**
 * Job Application Received (for Employer)
 */
export function jobApplicationReceivedEmail(
  employerName: string,
  studentName: string,
  jobTitle: string,
  applicationId: string
): EmailTemplate {
  const viewUrl = `${getFrontendUrl()}/dashboard/employer/applications/${applicationId}`;
  
  return {
    subject: `New Application for "${jobTitle}" - Micro Internship System`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Application</h1>
          </div>
          <div class="content">
            <p>Hello ${employerName},</p>
            <p>You have received a new application for your job posting:</p>
            <div class="info-box">
              <strong>Job:</strong> ${jobTitle}<br>
              <strong>Applicant:</strong> ${studentName}
            </div>
            <a href="${viewUrl}" class="button">View Application</a>
            <p>Review the application and respond to the candidate.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${employerName},\n\nYou have a new application for "${jobTitle}" from ${studentName}.\n\nView it here: ${viewUrl}`,
  };
}

/**
 * Application Accepted (for Student)
 */
export function applicationAcceptedEmail(
  studentName: string,
  jobTitle: string,
  companyName: string,
  jobId: string
): EmailTemplate {
  const viewUrl = `${getFrontendUrl()}/internships/${jobId}`;
  
  return {
    subject: `Congratulations! Your Application Was Accepted - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Application Accepted!</h1>
          </div>
          <div class="content">
            <p>Hello ${studentName},</p>
            <p>Great news! Your application has been accepted!</p>
            <div class="info-box">
              <strong>Job:</strong> ${jobTitle}<br>
              <strong>Company:</strong> ${companyName}
            </div>
            <a href="${viewUrl}" class="button">View Job Details</a>
            <p>Start working on the task and submit your work when complete.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${studentName},\n\nCongratulations! Your application for "${jobTitle}" at ${companyName} has been accepted!\n\nView details: ${viewUrl}`,
  };
}

/**
 * Payment Released (for Student)
 */
export function paymentReleasedEmail(
  studentName: string,
  amount: number,
  jobTitle: string,
  companyName: string
): EmailTemplate {
  return {
    subject: `Payment Released - ${amount} Gold Received`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount-box { background: white; padding: 20px; text-align: center; border: 2px solid #667eea; border-radius: 10px; margin: 20px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Released</h1>
          </div>
          <div class="content">
            <p>Hello ${studentName},</p>
            <p>Your payment has been released for the completed job!</p>
            <div class="amount-box">
              <div class="amount">${amount} Gold</div>
              <p><strong>Job:</strong> ${jobTitle}<br>
              <strong>Company:</strong> ${companyName}</p>
            </div>
            <p>The payment has been added to your account balance.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${studentName},\n\nPayment of ${amount} Gold has been released for "${jobTitle}" at ${companyName}.`,
  };
}

/**
 * Login Notification Email (for admin security)
 */
export function adminLoginEmail(name: string, loginTime: Date, ipAddress?: string): EmailTemplate {
  const formattedTime = loginTime.toLocaleString();
  
  return {
    subject: "Admin Login Detected - Micro Internship System",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Admin Login Notification</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>This is a security notification that your admin account was accessed.</p>
            <div class="info-box">
              <strong>Login Time:</strong> ${formattedTime}<br>
              ${ipAddress ? `<strong>IP Address:</strong> ${ipAddress}<br>` : ''}
              <strong>Account:</strong> Admin Account
            </div>
            ${ipAddress ? `
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              If you did not log in at this time, please change your password immediately and contact support.
            </div>
            ` : ''}
            <p>If this was you, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${name},\n\nYour admin account was accessed at ${formattedTime}${ipAddress ? ` from IP ${ipAddress}` : ''}.\n\nIf this wasn't you, please change your password immediately.`,
  };
}

/**
 * Welcome Email (for new signups)
 */
export function welcomeEmail(name: string, role: string): EmailTemplate {
  return {
    subject: "Welcome to Micro Internship System!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome, ${name}!</h1>
          </div>
          <div class="content">
            <p>Thank you for joining Micro Internship System!</p>
            <p>You've registered as a <strong>${role}</strong>. Get started by:</p>
            <ul>
              ${role === "student" 
                ? "<li>Browse available internships</li><li>Complete your profile</li><li>Start applying for jobs</li>"
                : role === "employer"
                ? "<li>Post your first job</li><li>Complete your company profile</li><li>Start finding talented students</li>"
                : "<li>Manage the platform</li><li>Review applications</li><li>Monitor system health</li>"
              }
            </ul>
            <p>We're excited to have you on board!</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome ${name}!\n\nThank you for joining Micro Internship System as a ${role}.`,
  };
}


