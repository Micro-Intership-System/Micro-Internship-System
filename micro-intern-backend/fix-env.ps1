# Script to fix .env file format
$envPath = ".env"
$envContent = @"
# MongoDB Connection
MONGO_URI=mongodb+srv://Icarus:t1@mintern.iijndhd.mongodb.net/?appName=mintern

# JWT Secret
JWT_SECRET=supersecretkey

# Supabase Configuration
SUPABASE_URL=https://mpyyxqrynphpflpvmfti.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weXl4cXJ5bnBocGZscHZtZnRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM0MDUyNywiZXhwIjoyMDgxOTE2NTI3fQ.jC8Q3J6pRnpfdfoFrO9BeAH1LpSv72rZva6wTSsuDl4

# Server Configuration
PORT=1547
FRONTEND_URL=http://localhost:5173

# Cookie Secret (optional)
COOKIE_SECRET=your_cookie_secret_here
"@

$envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
Write-Host ".env file has been fixed!"
Write-Host ""
Write-Host "IMPORTANT: You need to replace YOUR_SERVICE_ROLE_KEY_HERE with your actual Supabase service_role key."
Write-Host "Get it from: https://supabase.com/dashboard/project/mpyyxqrynphpflpvmfti/settings/api"
Write-Host "Look for 'service_role' key under 'Project API keys'"


