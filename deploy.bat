@echo off
echo.
echo ========================================
echo   Supabase Edge Function Deployment
echo ========================================
echo.

echo Checking Supabase CLI...
call npx supabase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Supabase CLI not found!
    echo Install with: npm install -g supabase
    pause
    exit /b 1
)
echo OK: Supabase CLI found
echo.

echo Linking project...
call npx supabase link --project-ref gyupyuyiilwfewzusoix
if errorlevel 1 (
    echo ERROR: Failed to link project
    echo Make sure you're logged in: npx supabase login
    pause
    exit /b 1
)
echo OK: Project linked
echo.

echo Deploying admin-auth...
call npx supabase functions deploy admin-auth
if errorlevel 1 (
    echo WARNING: Failed to deploy admin-auth
) else (
    echo OK: admin-auth deployed
)
echo.

echo Deploying admin-sections...
call npx supabase functions deploy admin-sections
if errorlevel 1 (
    echo WARNING: Failed to deploy admin-sections
) else (
    echo OK: admin-sections deployed
)
echo.

echo Deploying admin-settings...
call npx supabase functions deploy admin-settings
if errorlevel 1 (
    echo WARNING: Failed to deploy admin-settings
) else (
    echo OK: admin-settings deployed
)
echo.

echo ========================================
echo   Testing deployment...
echo ========================================
echo.

call node test-edge-function.js

echo.
echo ========================================
echo   Deployment complete!
echo ========================================
echo.
echo Next steps:
echo   1. Start dev server: npm run dev
echo   2. Try logging in with: admin123
echo   3. Check browser console for errors
echo.
pause
