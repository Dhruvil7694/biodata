# Quick Start: Deploy Schema to New Supabase Project

## Problem
New Supabase project is missing the database schema. 404 errors:
- `GET /rest/v1/sections?select=*&order=order_index.asc` → 404
- `GET /rest/v1/admin_settings?select=*` → 404

## Solution
Run the complete migration SQL in Supabase SQL Editor.

---

## Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com/projects
2. Select project: `ektofyrvnqoxojomnong`
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

---

## Step 2: Copy and Run Migration

Copy the entire contents of:
```
supabase/migrations/20260209000000_complete_schema.sql
```

Paste into the Supabase SQL Editor query window and click **Run**.

This will execute in ~2-5 seconds and create:
- ✅ `sections` table (9 rows)
- ✅ `admin_settings` table (1 row)
- ✅ `images` table
- ✅ RLS policies (6 total)
- ✅ Storage bucket: biodata-images
- ✅ Timestamps & triggers
- ✅ Seed data

---

## Step 3: Verify Success

Expected output: No errors, tables created.

To verify, run this query in SQL Editor:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;
```

Should return:
- admin_settings
- images
- sections

---

## Step 4: Verify Data

Run this query:
```sql
SELECT 'sections' as table_name, COUNT(*) as row_count FROM public.sections
UNION ALL
SELECT 'admin_settings', COUNT(*) FROM public.admin_settings
UNION ALL
SELECT 'images', COUNT(*) FROM public.images;
```

Expected result:
```
table_name       row_count
-----------      ---------
sections         9
admin_settings   1
images           0
```

---

## Step 5: Test Frontend

1. Refresh the deployed app in browser
2. Should now load without 404 errors
3. Hero section and other content should display
4. Admin panel should work

---

## Step 6: Change Admin Password ⚠️

Default admin password is `admin123` (insecure).

1. Open admin panel
2. Click "Change Password"
3. Enter old password: `admin123`
4. Enter new secure password
5. Save

---

## Done!

The new Supabase project now has the complete schema with all tables, policies, storage, and seed data.

**No additional setup needed.** Deployed app should work immediately.

---

## Troubleshooting

**If you get SQL errors:**
- The schema likely already exists (idempotent: uses IF NOT EXISTS)
- You can safely run it again
- If it's a genuine error, check the Supabase status: https://status.supabase.com

**If tables exist but data is empty:**
- Run this to manually seed (one-time):
```sql
INSERT INTO public.admin_settings (password_hash) 
VALUES ('$2a$10$rIC5gQz8lWfXGQZGz5Kxi.YZ5h8KBr1k4c4z5Tf5mK9X6XxYZ7vIK')
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);
```

**If health check still fails:**
- Wait 30 seconds (RLS propagation delay)
- Refresh browser
- Check browser console for actual error messages

---

## Reference

- **Project URL:** https://ektofyrvnqoxojomnong.supabase.co
- **SQL Editor:** https://app.supabase.com/project/ektofyrvnqoxojomnong/sql
- **Schema Doc:** See SCHEMA_ANALYSIS.md for full details
- **Migration File:** supabase/migrations/20260209000000_complete_schema.sql
