# Email Service Setup Guide

This guide will help you set up email service for the Micro-Internship System using Nodemailer.

## Supported Email Providers

The system supports multiple email providers:

1. **Gmail** (Recommended for development)
2. **SendGrid** (Recommended for production)
3. **Resend** (Modern, developer-friendly)
4. **Generic SMTP** (Any SMTP server)

## Option 1: Gmail Setup (Easiest for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Micro Internship System"
4. Click "Generate"
5. Copy the 16-character password (you'll need this)

### Step 3: Configure Environment Variables

Add to your `.env` file:

```env
# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
```

**Important:** Use the App Password, NOT your regular Gmail password!

## Option 2: SendGrid Setup (Recommended for Production)

### Step 1: Create SendGrid Account
1. Sign up at https://sendgrid.com
2. Verify your email address
3. Complete account setup

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name it "Micro Internship System"
4. Select "Full Access" or "Restricted Access" (with Mail Send permissions)
5. Copy the API key (you'll only see it once!)

### Step 3: Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Verify a Single Sender or Domain
3. Follow the verification steps

### Step 4: Configure Environment Variables

Add to your `.env` file:

```env
# Email Configuration (SendGrid)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key-here
EMAIL_FROM=verified-email@yourdomain.com
```

## Option 3: Resend Setup (Modern Alternative)

### Step 1: Create Resend Account
1. Sign up at https://resend.com
2. Verify your email

### Step 2: Get API Key
1. Go to API Keys section
2. Create a new API key
3. Copy the key

### Step 3: Configure Environment Variables

Add to your `.env` file:

```env
# Email Configuration (Resend)
EMAIL_SERVICE=resend
RESEND_API_KEY=your-resend-api-key-here
EMAIL_FROM=noreply@yourdomain.com
```

## Option 4: Generic SMTP Setup

For any SMTP server (Outlook, Yahoo, custom server, etc.):

```env
# Email Configuration (Generic SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false  # true for port 465, false for 587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=your-email@example.com
```

## Testing Email Configuration

After setting up your email service, start your server:

```bash
npm run dev
```

You should see:
- `✅ Email service configured successfully` - Email is working!
- `⚠️ Email service not configured` - Check your environment variables

If email is not configured, the system will still work but emails will be logged to console instead of being sent.

## Email Features Implemented

### 1. Password Reset
- **Endpoint:** `POST /api/auth/forgot-password`
- **Body:** `{ "email": "user@example.com" }`
- Sends password reset link (expires in 1 hour)

### 2. Email Verification
- **Endpoint:** `GET /api/auth/verify-email?token=...`
- Automatically sent on signup
- Resend: `POST /api/auth/resend-verification`

### 3. Welcome Email
- Automatically sent to new users on signup

### 4. Job Application Notifications
- **To Employer:** When a student applies
- **To Student:** When application is accepted

### 5. Payment Notifications
- **To Student:** When payment is released

## Email Templates

All email templates are located in `src/utils/emailTemplates.ts` and can be customized:

- `passwordResetEmail()` - Password reset link
- `emailVerificationEmail()` - Email verification link
- `welcomeEmail()` - Welcome message for new users
- `jobApplicationReceivedEmail()` - Notify employer of new application
- `applicationAcceptedEmail()` - Notify student of acceptance
- `paymentReleasedEmail()` - Notify student of payment

## Troubleshooting

### Error: "Email service not configured"
- Check that your `.env` file has the correct variables
- Restart your server after changing `.env`
- Verify the email service name matches exactly (gmail, sendgrid, resend)

### Error: "Invalid login credentials" (Gmail)
- Make sure you're using an App Password, not your regular password
- Verify 2-Factor Authentication is enabled
- Check that `EMAIL_USER` is your full email address

### Error: "Authentication failed" (SendGrid)
- Verify your API key is correct
- Check that your sender email is verified in SendGrid
- Ensure you're using `EMAIL_SERVICE=sendgrid` and `SENDGRID_API_KEY`

### Emails not sending
- Check server logs for error messages
- Verify your email provider's sending limits
- Check spam folder
- For Gmail, ensure "Less secure app access" is enabled (or use App Password)

### Test Email Sending

You can test email sending by:
1. Signing up a new user (should receive welcome + verification emails)
2. Requesting password reset
3. Applying to a job (employer should receive email)

## Production Recommendations

1. **Use SendGrid or Resend** for production (better deliverability)
2. **Set up SPF and DKIM records** for your domain
3. **Monitor email sending limits** and upgrade plan if needed
4. **Set up email bounce handling** (future enhancement)
5. **Use environment-specific email addresses** (dev vs production)

## Environment Variables Summary

```env
# Required for email service
EMAIL_SERVICE=gmail|sendgrid|resend  # OR use EMAIL_HOST for generic SMTP
EMAIL_FROM=your-email@example.com

# Gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SendGrid
SENDGRID_API_KEY=your-api-key

# Resend
RESEND_API_KEY=your-api-key

# Generic SMTP
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

## Next Steps

After setting up email:
1. Test password reset functionality
2. Test email verification
3. Monitor email delivery rates
4. Customize email templates to match your brand
5. Set up email analytics (optional)


