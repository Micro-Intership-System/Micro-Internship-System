# Quick Vercel Deployment - All in One! 🚀

Deploy both frontend and backend to Vercel in one deployment.

## ⚡ 5-Minute Setup

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push
```

### Step 2: Deploy on Vercel

1. **Go to [vercel.com](https://vercel.com)** → Sign up/login
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure:**

   **Framework Preset:** Vite
   
   **Root Directory:** (leave empty)
   
   **Build Command:** `cd micro-intern-frontend && npm run build`
   
   **Output Directory:** `micro-intern-frontend/dist`
   
   **Install Command:** `npm install` (runs in root, then installs subdirectories)

5. **Add Environment Variables:**

   **Backend (Required):**
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

   **Frontend (Required):**
   ```
   VITE_API_URL=/api
   ```

6. **Click "Deploy"** ⚡

7. **Wait 3-5 minutes** for build to complete

8. **Copy your URL:** `https://your-app.vercel.app`

### Step 3: Update FRONTEND_URL

After first deploy, update `FRONTEND_URL` with your actual Vercel URL and redeploy.

---

## ✅ That's It!

Your app is now live:
- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-app.vercel.app/api/*`

---

## 🐛 Quick Troubleshooting

**Build fails?**
- Check Vercel build logs
- Verify all dependencies in package.json
- Make sure TypeScript compiles

**API returns 404?**
- Verify `api/index.ts` exists
- Check environment variables are set
- Look at Vercel function logs

**CORS errors?**
- Update `FRONTEND_URL` to match your Vercel URL exactly
- Redeploy after updating

---

## 📝 Files Created

- `vercel.json` - Vercel configuration
- `api/index.ts` - Serverless function entry point
- `package.json` - Root package.json (optional)

---

For detailed instructions, see `VERCEL_DEPLOY.md`

