# Quick Fix Script - Fixes 406 and 500 errors
# Run with: .\fix-now.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  QUICK FIX - 406 & 500 Errors" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Fix RLS Policy
Write-Host "Step 1: Fixing RLS policy (406 error)..." -ForegroundColor Yellow
Write-Host "   Please run this SQL in Supabase SQL Editor:" -ForegroundColor White
Write-Host ""
Write-Host "   CREATE POLICY `"Anyone can read admin settings`"" -ForegroundColor Cyan
Write-Host "   ON public.admin_settings" -ForegroundColor Cyan
Write-Host "   FOR SELECT" -ForegroundColor Cyan
Write-Host "   USING (true);" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Or run: npx supabase db push" -ForegroundColor White
Write-Host ""

$response = Read-Host "Have you run the SQL? (y/n)"
if ($response -ne 'y') {
    Write-Host "`n   Please run the SQL first, then run this script again." -ForegroundColor Yellow
    exit
}

# Step 2: Deploy Edge Functions
Write-Host "`nStep 2: Deploying Edge Functions (500 error)..." -ForegroundColor Yellow

# Check Supabase CLI
try {
    $version = npx supabase --version 2>&1
    Write-Host "   ✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "   Install with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Link project
Write-Host "`n   Linking project..." -ForegroundColor White
npx supabase link --project-ref gyupyuyiilwfewzusoix
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Failed to link project!" -ForegroundColor Red
    Write-Host "   Make sure you're logged in: npx supabase login" -ForegroundColor Yellow
    exit 1
}

# Deploy functions
Write-Host "`n   Deploying admin-auth..." -ForegroundColor White
npx supabase functions deploy admin-auth

Write-Host "`n   Deploying admin-sections..." -ForegroundColor White
npx supabase functions deploy admin-sections

Write-Host "`n   Deploying admin-settings..." -ForegroundColor White
npx supabase functions deploy admin-settings

# Step 3: Test
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Testing..." -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

node test-edge-function.js

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Fix Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Refresh your browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "   2. Try logging in with: admin123" -ForegroundColor White
Write-Host "   3. Check console - should see no 406 or 500 errors" -ForegroundColor White
Write-Host ""
