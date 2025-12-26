# Script to add Gmail email configuration to .env file
$envPath = ".env"

# Read existing .env content
$existingContent = Get-Content $envPath -Raw

# Gmail email configuration
$emailConfig = @"

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=internshipmicro@gmail.com
EMAIL_PASSWORD=wjgbzcnwxtnxepja
EMAIL_FROM=internshipmicro@gmail.com
"@

# Check if email config already exists
if ($existingContent -match "EMAIL_SERVICE") {
    Write-Host "Email configuration already exists. Updating..."
    # Remove old email config lines
    $lines = Get-Content $envPath
    $newLines = @()
    $skipNext = $false
    foreach ($line in $lines) {
        if ($line -match "^# Email Configuration" -or $line -match "^EMAIL_") {
            $skipNext = $true
            continue
        }
        if ($skipNext -and $line -eq "") {
            $skipNext = $false
            continue
        }
        $skipNext = $false
        $newLines += $line
    }
    # Add new email config before the last line
    $newLines += $emailConfig
    $newLines | Out-File -FilePath $envPath -Encoding utf8
} else {
    # Append email config to existing content
    Add-Content -Path $envPath -Value $emailConfig -Encoding utf8
}

Write-Host "✅ Gmail email configuration added to .env file!"
Write-Host ""
Write-Host "Email Configuration:"
Write-Host "  Service: Gmail"
Write-Host "  User: internshipmicro@gmail.com"
Write-Host "  From: internshipmicro@gmail.com"
Write-Host ""
Write-Host "You can now start the server and test email functionality!"

