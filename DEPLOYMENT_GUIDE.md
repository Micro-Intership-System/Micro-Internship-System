# Deployment Guide - Vercel (Frontend) + Railway/Render (Backend)

This guide will help you deploy the Micro-Internship System to production.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Railway Account** (for backend) - Sign up at [railway.app](https://railway.app) OR
4. **Render Account** (alternative) - Sign up at [render.com](https://render.com)
5. **MongoDB Atlas** - Your database (already set up)
6. **Supabase** - Your storage (already set up)

---

## 🚀 Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### Step 2: Configure Backend Service
1. Railway will detect your `micro-intern-backend` folder
2. If not, click "Add Service" → "GitHub Repo" → Select your repo
3. Set **Root Directory** to: `micro-intern-backend`
4. Set **Build Command**: (leave empty, Railway auto-detects)
5. Set **Start Command**: `npm run dev` (or create a production start script)

### Step 3: Add Environment Variables
In Railway dashboard, go to **Variables** tab and add:

```env
# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email (choose one method)
# Option 1: Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Option 2: SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=your_email@example.com

# Option 3: Resend
EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email@example.com

# Frontend URL (for CORS)
FRONTEND_URL=https://your-vercel-app.vercel.app

# Node Environment
NODE_ENV=production
PORT=1547
```

### Step 4: Deploy
1. Railway will automatically deploy when you push to GitHub
2. Wait for deployment to complete
3. Copy your **Railway URL** (e.g., `https://your-app.railway.app`)
4. Test the API: `https://your-app.railway.app/` should return "Micro-Internship API is running"

### Step 5: Update Backend Start Script (Optional but Recommended)
Add to `micro-intern-backend/package.json`:

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "prestart": "npm run build"
}
```

Then update Railway start command to: `npm start`

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### Step 2: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `micro-intern-frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Step 3: Add Environment Variables
In Vercel dashboard, go to **Settings** → **Environment Variables**:

```env
VITE_API_URL=https://your-backend.railway.app
```

**Important:** Replace `https://your-backend.railway.app` with your actual Railway backend URL.

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Your app will be live at: `https://your-app.vercel.app`

### Step 5: Update Backend CORS
Go back to Railway, update the `FRONTEND_URL` variable:
```env
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy the backend so CORS accepts your Vercel URL.

---

## 🔧 Part 3: Alternative - Deploy Backend to Render

If you prefer Render over Railway:

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** micro-intern-backend
   - **Environment:** Node
   - **Root Directory:** `micro-intern-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run dev` (or `npm start` if you add production script)

### Step 3: Add Environment Variables
Same as Railway (see Part 1, Step 3)

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment
3. Copy your Render URL (e.g., `https://your-app.onrender.com`)

---

## 📝 Part 4: Update Frontend API Client (If Needed)

The frontend already uses `/api` as the base path. If your backend is on a different domain, you have two options:

### Option A: Use Environment Variable (Recommended)
The frontend will use `VITE_API_URL` if set. Make sure it's set in Vercel.

### Option B: Update API Client
If needed, update `micro-intern-frontend/src/api/client.ts`:

```typescript
const BASE = import.meta.env.VITE_API_URL || "/api";
```

---

## ✅ Part 5: Verify Deployment

### Test Backend
```bash
curl https://your-backend.railway.app/
# Should return: "Micro-Internship API is running"
```

### Test Frontend
1. Visit `https://your-app.vercel.app`
2. Try logging in
3. Check browser console for errors
4. Test API calls

### Common Issues

#### ❌ CORS Error
**Solution:** Make sure `FRONTEND_URL` in backend matches your Vercel URL exactly.

#### ❌ API Not Found (404)
**Solution:** 
- Check `VITE_API_URL` in Vercel environment variables
- Verify backend is running and accessible
- Check Railway/Render logs for errors

#### ❌ MongoDB Connection Failed
**Solution:**
- Verify `MONGO_URI` is correct in Railway/Render
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Railway/Render)
- Verify MongoDB cluster is not paused

#### ❌ Supabase Upload Failed
**Solution:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check Supabase storage buckets are created
- Verify bucket policies allow uploads

---

## 🔄 Part 6: Continuous Deployment

Both Vercel and Railway/Render support automatic deployments:

- **Vercel:** Automatically deploys on every push to main branch
- **Railway:** Automatically deploys on every push
- **Render:** Can be configured for auto-deploy

### Branch Strategy
- **Main branch:** Production (auto-deploys)
- **Other branches:** Preview deployments (Vercel creates preview URLs)

---

## 📊 Part 7: Monitoring & Logs

### Vercel Logs
1. Go to your project in Vercel
2. Click **"Deployments"** → Select a deployment → **"View Function Logs"**

### Railway Logs
1. Go to your service in Railway
2. Click **"Deployments"** → Select a deployment → **"View Logs"**

### Render Logs
1. Go to your service in Render
2. Click **"Logs"** tab

---

## 🎯 Quick Checklist

### Backend (Railway/Render)
- [ ] Repository connected
- [ ] Root directory set to `micro-intern-backend`
- [ ] All environment variables added
- [ ] Service deployed and running
- [ ] Backend URL copied

### Frontend (Vercel)
- [ ] Repository connected
- [ ] Root directory set to `micro-intern-frontend`
- [ ] `VITE_API_URL` environment variable set
- [ ] Build successful
- [ ] Frontend URL copied

### Configuration
- [ ] Backend `FRONTEND_URL` updated with Vercel URL
- [ ] Backend redeployed (for CORS)
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Supabase storage buckets configured

### Testing
- [ ] Backend health check works
- [ ] Frontend loads correctly
- [ ] Login works
- [ ] API calls succeed
- [ ] File uploads work
- [ ] No CORS errors

---

## 🚨 Troubleshooting

### Backend won't start
- Check Railway/Render logs
- Verify all environment variables are set
- Check MongoDB connection string
- Verify Node.js version compatibility

### Frontend build fails
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Check for TypeScript errors
- Verify build command is correct

### API calls fail
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Check backend logs for errors
- Verify CORS configuration

### Database connection fails
- Check MongoDB Atlas cluster is running
- Verify IP whitelist includes Railway/Render IPs
- Check connection string format
- Verify database user credentials

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

---

## 🎉 Success!

Once everything is deployed:
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://your-backend.railway.app`

Share your frontend URL with users and start using your production system!

