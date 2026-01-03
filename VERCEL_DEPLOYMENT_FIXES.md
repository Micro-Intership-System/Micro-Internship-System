# Vercel Deployment - Complete Fix Guide

## Issues Identified and Fixed

### ✅ 1. CORS Error - FIXED
**Problem:** Frontend requests from Vercel were being rejected.

**Fix Applied:**
- Updated CORS to allow all `.vercel.app` domains
- Added better error logging
- Made CORS more permissive for Vercel deployments

### ✅ 2. Email Service Timeout - FIXED
**Problem:** Email service was trying to connect during server startup, causing timeouts.

**Fixes Applied:**
- Removed email verification from server startup
- Added connection timeouts (5 seconds) to email transporter
- Made transporter creation more defensive (checks for credentials)
- Uses mock transporter if credentials are missing

### ✅ 3. MongoDB Connection - IMPROVED
**Problem:** MongoDB connection failing even with IP whitelisted.

**Fixes Applied:**
- Increased connection timeouts (30 seconds for Vercel)
- Added connection string validation
- Optimized for serverless (reduced minPoolSize, bufferCommands: false)
- Better error messages with specific troubleshooting steps
- Non-blocking connection for serverless environments

---

## Required Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

### Critical (Required):
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
FRONTEND_URL=https://your-frontend-app.vercel.app
```

### Optional (for email):
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### Optional (for Supabase):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## MongoDB Atlas Setup (Even if Already Whitelisted)

### Step 1: Verify Network Access
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster
3. Click **"Network Access"** in left sidebar
4. Verify you have `0.0.0.0/0` (Allow Access from Anywhere) OR specific IPs

### Step 2: Verify Connection String
1. In MongoDB Atlas, click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with your database name (or remove it)
6. Verify format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

### Step 3: Check Database User
1. Go to **"Database Access"** in MongoDB Atlas
2. Verify your database user exists and has proper permissions
3. If needed, create a new user with "Atlas Admin" role

### Step 4: Verify Cluster Status
1. Make sure your cluster is **running** (not paused)
2. Check cluster status in MongoDB Atlas dashboard

---

## Testing After Deployment

### 1. Test API Health
```bash
curl https://your-backend.vercel.app/api/
```
Should return: `"Micro-Internship API is running"`

### 2. Check Vercel Function Logs
1. Go to Vercel Dashboard → Deployments → Latest
2. Click **"View Function Logs"**
3. Look for:
   - ✅ `MongoDB connected successfully` (should appear on first request)
   - ❌ Should NOT see CORS errors
   - ❌ Should NOT see email connection timeouts during startup

### 3. Test Login
1. Go to your frontend login page
2. Try logging in
3. Check browser console (F12) for errors
4. Check Vercel Function Logs for backend errors

---

## Common Issues and Solutions

### Issue: "MongoDB connection failed" even after whitelisting
**Solutions:**
1. **Double-check IP whitelist:** Add `0.0.0.0/0` (allows all IPs)
2. **Wait 2-3 minutes** after whitelisting (changes take time to propagate)
3. **Verify connection string format:** Must start with `mongodb://` or `mongodb+srv://`
4. **Check cluster status:** Ensure cluster is running (not paused)
5. **Verify credentials:** Username and password in connection string must be correct

### Issue: "Not allowed by CORS"
**Solutions:**
1. **Set FRONTEND_URL:** Add `FRONTEND_URL=https://your-frontend.vercel.app` in Vercel env vars
2. **Redeploy:** After adding env var, redeploy backend
3. **Check logs:** Look for CORS warning messages showing rejected origin

### Issue: "Email service configuration error"
**Solutions:**
1. **This is now non-blocking:** Email errors won't prevent server startup
2. **Check email env vars:** If using email, ensure `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_APP_PASSWORD` are set
3. **Email will work when first email is sent:** Connection is now lazy

### Issue: "Internal Server Error" on login
**Solutions:**
1. **Check Vercel Function Logs:** This will show the exact error
2. **Verify MONGO_URI:** Connection string must be correct
3. **Verify JWT_SECRET:** Must be set
4. **Check MongoDB connection:** Should see connection success in logs

---

## Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] MongoDB cluster is running (not paused)
- [ ] Connection string format is correct
- [ ] `FRONTEND_URL` matches your actual Vercel frontend URL
- [ ] Code changes committed and pushed
- [ ] Vercel deployment completed successfully
- [ ] Checked Vercel Function Logs for errors
- [ ] Tested API health endpoint
- [ ] Tested login functionality

---

## Next Steps After Fixes

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Fix CORS, email timeout, and MongoDB connection for Vercel"
   git push
   ```

2. **Vercel will auto-deploy** - wait for deployment to complete

3. **Check Function Logs** after deployment

4. **Test the application** - login should work now!

---

## Still Having Issues?

If problems persist:

1. **Check Vercel Function Logs** - Most errors are logged there
2. **Verify all environment variables** are set correctly
3. **Test MongoDB connection** from your local machine using the same connection string
4. **Check MongoDB Atlas logs** for connection attempts
5. **Verify Vercel project settings** - ensure backend is configured as serverless function

