# PowerShell script to deploy Edge Functions and test them
# Run with: .\deploy-and-test.ps1

Write-Host "`n🚀 Supabase Edge Function Deployment & Test Script" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if Supabase CLI is installed
Write-Host "`n📦 Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $version = npx supabase --version 2>&1
    Write-Host "   ✅ Supabase CLI found: $version" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "   Install with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check project link
Write-Host "`n🔗 Checking project link..." -ForegroundColor Yellow
$linkStatus = npx supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Project not linked. Linking now..." -ForegroundColor Yellow
    npx supabase link --project-ref gyupyuyiilwfewzusoix
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to link project!" -ForegroundColor Red
        Write-Host "   Make sure you're logged in: npx supabase login" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "   ✅ Project linked" -ForegroundColor Green
}

# Deploy Edge Functions
Write-Host "`n📤 Deploying Edge Functions..." -ForegroundColor Yellow

$functions = @('admin-auth', 'admin-sections', 'admin-settings')

foreach ($func in $functions) {
    Write-Host "`n   Deploying $func..." -ForegroundColor Cyan
    npx supabase functions deploy $func
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $func deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to deploy $func" -ForegroundColor Red
    }
}

# Wait a moment for deployment to propagate
Write-Host "`n⏳ Waiting for deployment to propagate..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Run tests
Write-Host "`n🧪 Running tests..." -ForegroundColor Yellow
node test-edge-function.js

Write-Host "`n✨ Deployment complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start your dev server: npm run dev" -ForegroundColor White
Write-Host "   2. Try logging in with password: admin123" -ForegroundColor White
Write-Host "   3. Check browser console for any errors" -ForegroundColor White
Write-Host "   4. Change the default password after first login" -ForegroundColor White
