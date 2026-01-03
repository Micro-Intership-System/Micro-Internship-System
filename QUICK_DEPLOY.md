# Quick Deploy Guide - 10 Minutes

## 🚀 Step-by-Step Deployment

### Deploy Everything to Vercel - 10 minutes

**Note:** This guide deploys both frontend and backend to Vercel. For the quickest setup, see `QUICK_VERCEL_DEPLOY.md`.

1. **Go to [vercel.com](https://vercel.com)** and sign up with GitHub
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure:**
   - Framework Preset: **Vite**
   - Root Directory: (leave empty)
   - Build Command: `cd micro-intern-frontend && npm run build`
   - Output Directory: `micro-intern-frontend/dist`
   - Install Command: `npm install`
5. **Add Environment Variables** (Settings → Environment Variables):

   **Backend Variables:**
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
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

6. **Click "Deploy"**
7. **Wait for deployment** (3-5 minutes)
8. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

9. **Update `FRONTEND_URL`** with your actual Vercel URL and redeploy

---

## ✅ Test Your Deployment

1. **Visit your Vercel URL:** `https://your-app.vercel.app`
2. **Try logging in**
3. **Check browser console** for errors
4. **Test API calls**

---

## 🐛 Common Issues

### CORS Error
- Make sure `FRONTEND_URL` matches your Vercel URL exactly
- Redeploy after updating

### API Not Found
- Verify `VITE_API_URL` is set to `/api` in Vercel
- Check Vercel function logs for backend errors
- Verify `api/index.ts` exists

### Build Failed
- Check Vercel build logs
- Verify all dependencies are in `package.json`

---

## 📝 Environment Variables Checklist

### Vercel (Backend & Frontend)
- [ ] MONGO_URI
- [ ] JWT_SECRET
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] EMAIL_SERVICE
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD
- [ ] FRONTEND_URL
- [ ] NODE_ENV=production
- [ ] VITE_API_URL=/api

---

## 🎉 Done!

Your app is now live on Vercel:
- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-app.vercel.app/api/*`

For detailed instructions, see `VERCEL_DEPLOY.md` or `QUICK_VERCEL_DEPLOY.md`
