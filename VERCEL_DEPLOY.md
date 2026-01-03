# Complete Vercel Deployment Guide

Deploy both frontend and backend to Vercel in one go!

## 🚀 Quick Start (10 Minutes)

### Step 1: Prepare Your Repository

1. **Make sure all files are committed:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login with GitHub
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure Project Settings:**

   **Framework Preset:** Vite
   
   **Root Directory:** Leave empty (we'll handle this with vercel.json)
   
   **Build Command:** `cd micro-intern-frontend && npm run build`
   
   **Output Directory:** `micro-intern-frontend/dist`
   
   **Install Command:** `npm install` (runs in root)

5. **Add Environment Variables:**

   Click "Environment Variables" and add:

   **Backend Variables:**
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   FRONTEND_URL=https://your-app.vercel.app (update after first deploy)
   NODE_ENV=production
   ```

   **Frontend Variables:**
   ```
   VITE_API_URL=/api
   ```

   **Note:** For Vercel, the frontend uses `/api` which automatically routes to backend functions.

6. **Click "Deploy"**

7. **Wait for deployment** (3-5 minutes)

8. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

### Step 3: Update Environment Variables

1. After first deployment, update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-actual-vercel-url.vercel.app
   ```

2. **Redeploy** (Vercel will auto-redeploy when you save env vars)

---

## 📁 Project Structure for Vercel

```
Micro-Internship-System/
├── vercel.json                 # Vercel configuration
├── micro-intern-frontend/      # Frontend React app
│   ├── src/
│   ├── package.json
│   └── dist/                   # Build output
├── micro-intern-backend/       # Backend Express app
│   ├── src/
│   │   └── index.ts            # Main server file
│   ├── api/
│   │   └── index.ts            # Vercel serverless entry
│   └── package.json
└── package.json                # Root package.json (optional)
```

---

## 🔧 How It Works

### Frontend
- Built with Vite
- Served as static files from `micro-intern-frontend/dist`
- API calls go to `/api/*` which routes to backend functions

### Backend
- Express app converted to Vercel serverless function
- All `/api/*` routes are handled by the backend
- Runs as serverless functions (scales automatically)

---

## 📝 Environment Variables Reference

### Required for Backend
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `EMAIL_SERVICE` - Email service (gmail, sendgrid, resend)
- `EMAIL_USER` - Email address
- `EMAIL_PASSWORD` - Email password or API key
- `FRONTEND_URL` - Your Vercel frontend URL (for CORS)
- `NODE_ENV` - Set to `production`

### Required for Frontend
- `VITE_API_URL` - Set to `/api` (relative path for Vercel)

---

## 🐛 Troubleshooting

### Build Fails
**Check:**
1. All dependencies are in `package.json`
2. TypeScript compiles without errors
3. Check Vercel build logs for specific errors

### API Routes Return 404
**Solution:**
1. Verify `vercel.json` routes are correct
2. Check that `micro-intern-backend/src/index.ts` exports the app
3. Ensure backend environment variables are set

### CORS Errors
**Solution:**
1. Update `FRONTEND_URL` in environment variables
2. Make sure it matches your Vercel URL exactly
3. Redeploy after updating

### MongoDB Connection Fails
**Solution:**
1. Verify `MONGO_URI` is correct
2. Check MongoDB Atlas IP whitelist (add Vercel IPs or `0.0.0.0/0`)
3. Ensure MongoDB cluster is not paused

### Environment Variables Not Working
**Solution:**
1. Make sure variables are set for "Production" environment
2. Redeploy after adding/updating variables
3. Check variable names match exactly (case-sensitive)

---

## 🔄 Updating Your Deployment

### Automatic Deployments
- Vercel automatically deploys on every push to main branch
- Preview deployments for other branches

### Manual Redeploy
1. Go to Vercel dashboard
2. Click on your project
3. Click "Deployments"
4. Click "..." on latest deployment
5. Click "Redeploy"

---

## 📊 Monitoring

### View Logs
1. Go to Vercel dashboard
2. Click on your project
3. Click "Deployments"
4. Click on a deployment
5. Click "View Function Logs"

### Check Function Performance
1. Go to "Analytics" tab
2. View function invocations
3. Check response times
4. Monitor errors

---

## ✅ Deployment Checklist

Before deploying:
- [ ] All code committed to Git
- [ ] `vercel.json` is in root directory
- [ ] Backend exports app correctly
- [ ] Frontend API client uses `/api` path
- [ ] All environment variables ready
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Supabase storage buckets configured

After deploying:
- [ ] Frontend loads correctly
- [ ] API routes respond
- [ ] Login works
- [ ] Database connections work
- [ ] File uploads work
- [ ] No CORS errors

---

## 🎉 Success!

Your app is now live on Vercel:
- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-app.vercel.app/api/*`

Everything runs on Vercel - no need for separate backend hosting!

---

## 💡 Pro Tips

1. **Use Vercel CLI for local testing:**
   ```bash
   npm i -g vercel
   vercel dev
   ```

2. **Set up preview deployments** for testing before production

3. **Monitor function logs** to debug issues quickly

4. **Use Vercel Analytics** to track performance

5. **Set up custom domain** in Vercel settings

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)

