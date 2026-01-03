# Quick Deploy Guide - 10 Minutes

## 🚀 Step-by-Step Deployment

### Part 1: Deploy Backend (Railway) - 5 minutes

1. **Go to [railway.app](https://railway.app)** and sign up with GitHub
2. **Click "New Project"** → **"Deploy from GitHub repo"**
3. **Select your repository**
4. **Configure:**
   - Root Directory: `micro-intern-backend`
   - Railway will auto-detect build/start from `Procfile` and `package.json`
   - Build Command: `npm run build` (auto-detected)
   - Start Command: `npm start` (auto-detected from Procfile)
5. **Add Environment Variables** (Settings → Variables):
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   FRONTEND_URL=https://your-app.vercel.app (update after frontend deploy)
   NODE_ENV=production
   PORT=1547
   ```
6. **Wait for deployment** (2-3 minutes)
7. **Copy your Railway URL** (e.g., `https://your-app.railway.app`)

---

### Part 2: Deploy Frontend (Vercel) - 5 minutes

1. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure:**
   - Framework Preset: **Vite**
   - Root Directory: `micro-intern-frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variable:**
   - Key: `VITE_API_URL`
   - Value: `https://your-app.railway.app` (your Railway backend URL)
6. **Click "Deploy"**
7. **Wait for build** (2-3 minutes)
8. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

---

### Part 3: Update CORS - 1 minute

1. **Go back to Railway**
2. **Update `FRONTEND_URL`** variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. **Redeploy** (Railway auto-redeploys when you save)

---

## ✅ Test Your Deployment

1. **Visit your Vercel URL:** `https://your-app.vercel.app`
2. **Try logging in**
3. **Check browser console** for errors
4. **Test API calls**

---

## 🐛 Common Issues

### CORS Error
- Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Redeploy backend after updating

### API Not Found
- Verify `VITE_API_URL` is set in Vercel
- Check Railway logs for backend errors

### Build Failed
- Check Vercel build logs
- Verify all dependencies are in `package.json`

---

## 📝 Environment Variables Checklist

### Railway (Backend)
- [ ] MONGO_URI
- [ ] JWT_SECRET
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] EMAIL_SERVICE
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD
- [ ] FRONTEND_URL
- [ ] NODE_ENV=production

### Vercel (Frontend)
- [ ] VITE_API_URL

---

## 🎉 Done!

Your app is now live:
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://your-app.railway.app`

For detailed instructions, see `DEPLOYMENT_GUIDE.md`

