# Vercel Deployment Fixes

## Issues Fixed

### 1. ✅ CORS Error - "Not allowed by CORS"

**Problem:** Frontend requests were being rejected by CORS middleware.

**Fix Applied:**
- Updated CORS configuration to allow all Vercel domains (`.vercel.app`)
- Added better logging for rejected origins
- Made CORS more permissive in development

**Action Required:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update `FRONTEND_URL` with your Vercel frontend URL:
   ```
   FRONTEND_URL=https://your-frontend-app.vercel.app
   ```
3. Redeploy the backend

---

### 2. ✅ Email Service Timeout

**Problem:** Email service was trying to connect during server startup, causing timeouts.

**Fix Applied:**
- Removed email verification from server startup
- Made email verification lazy (only when first email is sent)
- Added timeout protection for email verification

**Action Required:**
- No action needed - email will work when first email is sent
- If emails still fail, check your email environment variables in Vercel

---

### 3. ⚠️ MongoDB IP Whitelist

**Problem:** MongoDB Atlas is rejecting connections from Vercel's IP addresses.

**Fix Required (Manual Step):**

1. **Go to MongoDB Atlas:**
   - Login to https://cloud.mongodb.com
   - Select your cluster

2. **Whitelist Vercel IPs:**
   - Click "Network Access" in the left sidebar
   - Click "Add IP Address"
   - **Option A (Recommended for Development):** Add `0.0.0.0/0` to allow all IPs
     - Click "Allow Access from Anywhere"
     - Click "Confirm"
   - **Option B (More Secure):** Add Vercel's IP ranges:
     ```
     76.76.21.0/24
     76.223.126.0/24
     ```
     (Note: Vercel uses dynamic IPs, so Option A is easier)

3. **Wait 1-2 minutes** for changes to propagate

4. **Redeploy** your backend on Vercel

5. **Verify Connection:**
   - Check Vercel Function Logs
   - Should see: `✅ MongoDB connected successfully`

---

## Environment Variables Checklist

Make sure these are set in **Vercel Dashboard → Settings → Environment Variables**:

### Required:
- ✅ `MONGO_URI` - Your MongoDB connection string
- ✅ `JWT_SECRET` - Secret key for JWT tokens
- ✅ `FRONTEND_URL` - Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

### Optional (for email):
- `EMAIL_SERVICE` - `gmail`, `sendgrid`, `resend`, or `smtp`
- `EMAIL_USER` - Your email address
- `EMAIL_PASSWORD` or `EMAIL_APP_PASSWORD` - Email password/app password
- `EMAIL_FROM` - From email address

### Supabase (if using):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## Testing After Fixes

1. **Test API Health:**
   ```bash
   curl https://your-backend.vercel.app/api/
   ```
   Should return: `"Micro-Internship API is running"`

2. **Test Login:**
   - Go to your frontend login page
   - Try logging in
   - Check browser console for errors
   - Check Vercel Function Logs for backend errors

3. **Check Logs:**
   - Vercel Dashboard → Deployments → Latest → View Function Logs
   - Should see: `✅ MongoDB connected successfully`
   - Should NOT see CORS errors

---

## Still Having Issues?

If you still see errors:

1. **Check Vercel Function Logs** - Most errors will be logged there
2. **Verify Environment Variables** - Make sure all required vars are set
3. **Check MongoDB Atlas** - Ensure cluster is running (not paused)
4. **Check Network Access** - IP whitelist should include `0.0.0.0/0` or Vercel IPs

