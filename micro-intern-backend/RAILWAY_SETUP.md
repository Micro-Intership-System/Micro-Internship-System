# Railway Deployment Setup

## Quick Fix for "Script start.sh not found" Error

Railway needs configuration files to know how to build and run your app. This repository includes:

1. **`Procfile`** - Tells Railway how to start the app
2. **`railway.json`** - Railway-specific configuration
3. **`package.json`** - Contains build and start scripts

## Files Created

### Procfile
```
web: npm start
```
This tells Railway to run `npm start` when deploying.

### railway.json
Contains Railway-specific build and deploy configuration.

### package.json Scripts
```json
{
  "build": "tsc",
  "start": "node dist/index.js",
  "prestart": "npm run build"
}
```

## Railway Configuration Steps

### Option 1: Automatic Detection (Recommended)
1. Railway will automatically detect:
   - Node.js project from `package.json`
   - Build command from `npm run build`
   - Start command from `Procfile`

2. **Root Directory**: Set to `micro-intern-backend` in Railway dashboard

3. **No additional configuration needed!**

### Option 2: Manual Configuration
If Railway doesn't auto-detect:

1. Go to your service in Railway
2. Click **"Settings"** → **"Build & Deploy"**
3. Set:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `micro-intern-backend`

## Troubleshooting

### Error: "Script start.sh not found"
**Solution**: Make sure `Procfile` exists in `micro-intern-backend/` directory

### Error: "Railpack could not determine how to build"
**Solution**: 
1. Verify `package.json` has `build` and `start` scripts
2. Check that `Procfile` exists
3. Ensure Root Directory is set to `micro-intern-backend`

### Build Fails
**Check**:
1. TypeScript compilation errors
2. Missing dependencies in `package.json`
3. Check Railway build logs for specific errors

### App Crashes on Start
**Check**:
1. Environment variables are set correctly
2. MongoDB connection string is valid
3. Port is set correctly (Railway uses `PORT` env var automatically)

## Environment Variables Checklist

Make sure these are set in Railway:
- `MONGO_URI`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EMAIL_SERVICE`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `FRONTEND_URL` (your Vercel URL)
- `NODE_ENV=production`
- `PORT` (Railway sets this automatically, but you can override)

## Deployment Flow

1. **Build Phase**: `npm run build` compiles TypeScript to JavaScript
2. **Start Phase**: `npm start` runs `node dist/index.js`
3. **Railway** automatically:
   - Installs dependencies (`npm install`)
   - Runs build command
   - Runs start command
   - Exposes the app on a public URL

## Testing Locally

Before deploying, test the build locally:

```bash
cd micro-intern-backend
npm run build
npm start
```

If this works locally, it should work on Railway!

## Need Help?

- Check Railway logs: Dashboard → Your Service → "Deployments" → Click deployment → "View Logs"
- Verify all files are committed to Git
- Ensure Root Directory is correct in Railway settings

