# Supabase Setup Guide

This guide will help you set up Supabase Storage for the Micro-Internship System.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: micro-internship (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

## Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **service_role key** (under "Project API keys" → "service_role" - keep this secret!)

## Step 3: Create Storage Buckets

1. Go to **Storage** in the left sidebar
2. Create the following buckets (click "New bucket" for each):

   ### Bucket 1: `certificates`
   - **Name**: `certificates`
   - **Public bucket**: ✅ Yes (so certificates can be accessed via URL)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `application/pdf`

   ### Bucket 2: `job-submissions`
   - **Name**: `job-submissions`
   - **Public bucket**: ✅ Yes
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `application/pdf`

   ### Bucket 3: `profile-pictures`
   - **Name**: `profile-pictures`
   - **Public bucket**: ✅ Yes
   - **File size limit**: 2 MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`

   ### Bucket 4: `company-logos`
   - **Name**: `company-logos`
   - **Public bucket**: ✅ Yes
   - **File size limit**: 2 MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`

   ### Bucket 5: `chat-attachments`
   - **Name**: `chat-attachments`
   - **Public bucket**: ✅ Yes
   - **File size limit**: 10 MB
   - **Allowed MIME types**: (leave empty for all types, or specify as needed)

## Step 4: Set Up Storage Policies (Optional but Recommended)

For production, you should set up Row Level Security (RLS) policies. For now, we'll use public buckets for simplicity.

If you want to add security later:
1. Go to **Storage** → Select a bucket → **Policies**
2. Create policies to control who can upload/download files

## Step 5: Configure Environment Variables

Add these to your `.env` file in `micro-intern-backend/`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Other existing variables...
MONGO_URI=your_mongodb_connection_string
PORT=1547
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
FRONTEND_URL=http://localhost:5173
```

## Step 6: Test the Setup

1. Start your backend server:
   ```bash
   cd micro-intern-backend
   npm run dev
   ```

2. The server should start without errors. If you see Supabase-related errors, check:
   - Your `.env` file has the correct values
   - The buckets are created in Supabase
   - Your internet connection is working

## Features Enabled

With Supabase Storage integrated, the following features are now available:

1. **Certificate Generation**: PDF certificates are generated and stored in Supabase
2. **Job Submission PDFs**: Students can upload PDF proof of work
3. **Profile Pictures**: Users can upload profile pictures
4. **Company Logos**: Employers can upload company logos
5. **Chat Attachments**: File attachments in task chats

## API Endpoints

### Upload Endpoints

- `POST /api/upload/profile-picture` - Upload profile picture
- `POST /api/upload/company-logo` - Upload company logo (employer only)
- `POST /api/upload/job-submission/:taskId` - Upload job submission PDF (student only)
- `POST /api/upload/chat-attachment/:taskId` - Upload chat attachment
- `DELETE /api/upload/:bucket/:path` - Delete a file (admin or file owner)

### Example Usage

```javascript
// Upload profile picture
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload/profile-picture', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('File URL:', data.data.url);
```

## Troubleshooting

### Error: "SUPABASE_URL is not defined"
- Make sure your `.env` file exists and has `SUPABASE_URL` set
- Restart your server after adding environment variables

### Error: "Failed to upload file"
- Check that the bucket exists in Supabase
- Verify the bucket is set to "Public"
- Check file size limits
- Verify MIME type is allowed

### Files not accessible
- Ensure buckets are set to "Public bucket: Yes"
- Check the file path is correct
- Verify the Supabase URL is correct

## Next Steps

After setting up Supabase Storage, you can:
1. Implement email service (next step)
2. Add file validation on frontend
3. Add image resizing/optimization
4. Implement file deletion cleanup
5. Add storage usage monitoring



