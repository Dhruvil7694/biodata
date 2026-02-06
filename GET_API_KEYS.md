# Get Your Supabase API Keys

## Quick Link
https://supabase.com/dashboard/project/gyupyuyiilwfewzusoix/settings/api

## What You Need

On that page, you'll see:

### 1. Project URL
```
https://gyupyuyiilwfewzusoix.supabase.co
```

### 2. anon/public key
This is a long JWT token that looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXB5dXlpaWx3ZmV3enVzb2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3MjM0MTEsImV4cCI6MjAyNTI5OTQxMX0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. service_role key (for Edge Functions - keep this secret!)
Another JWT token - DO NOT commit this to git!

## Update Your .env File

Replace the content in `.env` with:

```env
VITE_SUPABASE_PROJECT_ID="gyupyuyiilwfewzusoix"
VITE_SUPABASE_PUBLISHABLE_KEY="<paste-your-anon-key-here>"
VITE_SUPABASE_URL="https://gyupyuyiilwfewzusoix.supabase.co"
```

## After Updating

1. Save the `.env` file
2. Restart your dev server
3. Hard refresh your browser (Ctrl+Shift+R)
4. The 401 errors should be gone!

## Why This Happened

You switched from project `jitomjkpclnlzidkfqun` to `gyupyuyiilwfewzusoix`, but the API key in your `.env` was still from the old project (or was incorrect format).
