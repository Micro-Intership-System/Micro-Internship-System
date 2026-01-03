# Check Supabase Buckets

The 500 error when uploading is likely because the storage buckets don't exist in Supabase.

## Required Buckets

You need to create these buckets in Supabase:

1. `profile-pictures` - For user profile pictures
2. `company-logos` - For employer company logos
3. `job-submissions` - For job submission PDFs
4. `chat-attachments` - For chat file attachments
5. `certificates` - For course completion certificates

## How to Create Buckets

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/mpyyxqrynphpflpvmfti/storage/buckets

2. Click "New bucket" for each bucket above

3. For each bucket:
   - **Name**: Use the exact name (e.g., `profile-pictures`)
   - **Public bucket**: ✅ Check this (so files are publicly accessible)
   - **File size limit**: 10MB (or higher if needed)
   - **Allowed MIME types**: Leave empty (allows all types)

4. Create all 5 buckets

## Verify Buckets Exist

After creating, you should see all 5 buckets in the Storage section.

## Test Upload Again

Once buckets are created, try uploading a profile picture again.

