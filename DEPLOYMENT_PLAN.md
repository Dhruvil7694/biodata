# RECOMMENDATIONS & DEPLOYMENT PLAN

**Status:** 🔴 DO NOT DEPLOY - CRITICAL SECURITY ISSUES  
**Date:** February 9, 2026

---

## EXECUTIVE SUMMARY FOR USER

You were absolutely correct to stop before running the schema migration.

**Three critical issues found:**

1. **🔴 CRITICAL: password_hash is readable by anonymous users**
   - RLS policy: `CREATE POLICY "Anyone can read admin settings" ... USING (true)`
   - Any visitor to your site can query and read the bcrypt password hash
   - This enables offline brute-force attacks
   - **YOUR APP CURRENTLY HAS THIS VULNERABILITY**

2. **🔴 CRITICAL: Plaintext password 'admin123' stored in database**
   - Migration 20260206163000_plaintext_reset.sql stores 'admin123' as password_hash
   - This was intended as a development bootstrap but is dangerous
   - Edge Function auto-upgrades it, but it's still a risk vector

3. **🟠 HIGH: TypeScript types are missing 3 columns**
   - hero_image_position, is_privacy_mode, social_links
   - Will cause TypeScript errors or undefined references in frontend

**Additional issues:**
- Synthetic complete_schema.sql perpetuates all these vulnerabilities
- Historical migration chain has redundant operations and conflicts
- exec_sql function should be removed (temporary emergency-only)
- Storage policies allow any authenticated user to write (likely unintended)

---

## DECISION: STRATEGY B + SECURITY FIXES

**Recommended approach:**

Create ONE clean baseline migration that:
- ✅ Fixes password_hash exposure (use database view)
- ✅ Removes plaintext password (bootstrap flow instead)
- ✅ Has all final columns
- ✅ Has correct RLS policies
- ✅ Has proper storage policies
- ✅ Removes exec_sql function
- ✅ No redundant operations

**Why NOT Strategy A:**
- 10 historical migrations with vulnerabilities
- Plaintext password ends up in database
- Admin credentials exposed to public
- TypeScript types stay stale
- exec_sql stays permanent
- Too much legacy baggage

---

## DETAILED FIX: RLS POLICY FOR admin_settings

### Current (VULNERABLE)
```sql
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (true);  -- Anyone can SELECT *
```

### Root Cause
- `USING (true)` = no conditions, all rows
- `anon, authenticated` = all users including anonymous
- `SELECT *` = all columns including password_hash

### Solution: Database View

Create a view that excludes password_hash:

```sql
-- 1. Drop unsafe policy
DROP POLICY IF EXISTS "Anyone can read admin settings" ON public.admin_settings;

-- 2. Create view with only public columns
CREATE VIEW public.site_settings_public AS
SELECT 
  id,
  site_title,
  hero_image_url,
  hero_image_position,
  is_privacy_mode,
  social_links,
  created_at,
  updated_at
  -- ⚠️ NOT password_hash
FROM public.admin_settings;

-- 3. Enable RLS on view
ALTER TABLE public.site_settings_public ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone to read the view
CREATE POLICY "Anyone can read site settings"
ON public.site_settings_public
FOR SELECT
TO anon, authenticated
USING (true);

-- 5. Service role still manages the main table
CREATE POLICY "Service role manages admin settings"
ON public.admin_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Why This Works
- ✅ password_hash never exposed to anon users
- ✅ View only has safe columns
- ✅ Edge Function still reads password_hash using service_role
- ✅ Frontend reads from view (minimal changes)
- ✅ Maintains current functionality

### Frontend Change (Minimal)
```typescript
// Before (VULNERABLE)
const { data } = await supabase
  .from('admin_settings')
  .select('*');

// After (SAFE)
const { data } = await supabase
  .from('site_settings_public')  // ← Different table name
  .select('*');
```

---

## DETAILED FIX: PASSWORD BOOTSTRAP

### Current (INSECURE)
Migration hardcodes password_hash = 'admin123' (sometimes plaintext, sometimes hash).
- Anyone with DB access can read password
- Default password is guessable
- No onboarding flow

### Solution: Require Setup on First Run

**Step 1: Seed DB with NULL password**
```sql
INSERT INTO public.admin_settings (password_hash, site_title)
SELECT NULL, 'Matrimonial Biodata'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);
```

**Step 2: Edge Function detects NULL**
```typescript
if (action === 'login') {
  if (!settings.password_hash || settings.password_hash === '') {
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Admin account not initialized',
        requiresSetup: true
      }),
      { status: 401 }
    );
  }
  // ... normal login
}

if (action === 'setup-password') {
  // Only works on first call (when password is NULL)
  if (settings.password_hash !== null && settings.password_hash !== '') {
    return new Response(
      JSON.stringify({ success: false, message: 'Already initialized' }),
      { status: 401 }
    );
  }
  
  const hash = await bcrypt.hash(newPassword, 10);
  await supabase
    .from('admin_settings')
    .update({ password_hash: hash })
    .eq('id', id);
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Step 3: Frontend shows setup modal on first login**
```typescript
// In AdminLoginModal or new SetupModal
if (response.data.requiresSetup) {
  showSetupModal();  // Prompt for password creation
}
```

### Why This Works
- ✅ No hardcoded password
- ✅ Admin chooses secure password on first run
- ✅ Password cannot be guessed from migrations
- ✅ No secrets in git
- ✅ Secure onboarding experience

---

## DETAILED FIX: TypeScript TYPES

### Current (STALE)
`src/integrations/supabase/types.ts` is missing 3 columns:
```typescript
// Missing: hero_image_position, is_privacy_mode, social_links
admin_settings: {
  Row: {
    created_at: string
    hero_image_url: string | null
    id: string
    password_hash: string      // ← Will still be included (private)
    site_title: string | null
    updated_at: string
  }
}
```

### Option A: Regenerate Types (If possible)
```bash
# Run Supabase CLI to regenerate types from new DB schema
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Option B: Manual Fix
Add missing columns:
```typescript
admin_settings: {
  Row: {
    created_at: string
    hero_image_url: string | null
    hero_image_position: string | null  // ← Add
    id: string
    is_privacy_mode: boolean              // ← Add
    password_hash: string
    site_title: string | null
    social_links: any[]                   // ← Add
    updated_at: string
  }
  Insert: {
    // ... add same columns
  }
  Update: {
    // ... add same columns
  }
}

// Also add view type
site_settings_public: {
  Row: {
    created_at: string
    hero_image_url: string | null
    hero_image_position: string | null
    id: string
    is_privacy_mode: boolean
    site_title: string | null
    social_links: any[]
    updated_at: string
    // NO password_hash
  }
  Insert: { ... }
  Update: { ... }
}
```

---

## RLS POLICY MATRIX - FINAL STATE

### Table: `sections`
| Policy | Action | Roles | Condition | Access |
|--------|--------|-------|-----------|--------|
| "Anyone can view visible sections" | SELECT | anon, authenticated | visible = true | ✅ Public read |
| "Service role manages sections" | ALL | service_role | true | ✅ Admin write |

### Table: `images`
| Policy | Action | Roles | Condition | Access |
|--------|--------|-------|-----------|--------|
| "Anyone can view images" | SELECT | anon, authenticated | section.visible = true | ✅ Public read |
| "Service role manages images" | ALL | service_role | true | ✅ Admin write |

### Table: `admin_settings` (PRIVATE)
| Policy | Action | Roles | Condition | Access |
|--------|--------|-------|-----------|--------|
| "Service role manages admin settings" | ALL | service_role | true | ✅ Admin only |
| (NO public SELECT on main table) | - | - | - | 🔴 Blocked |

### View: `site_settings_public` (NEW)
| Policy | Action | Roles | Condition | Access |
|--------|--------|-------|-----------|--------|
| "Anyone can read site settings" | SELECT | anon, authenticated | true | ✅ Public read safe columns |

### Storage: `biodata-images`
| Policy | Action | Roles | Condition | Access |
|--------|--------|-------|-----------|--------|
| "Anyone can view images" | SELECT | anon, authenticated | bucket_id='biodata-images' | ✅ Public read |
| "Service role manages images" | ALL | service_role | bucket_id='biodata-images' | ✅ Admin write |

---

## STORAGE POLICY MATRIX

| Bucket | Policy | Action | Roles | Recommendation |
|--------|--------|--------|-------|-----------------|
| biodata-images | "Anyone can view biodata images" | SELECT | anon, authenticated | ✅ Keep (portfolio is public) |
| biodata-images | "Service role manages biodata images" | ALL | service_role | ✅ Keep (admin uploads) |
| biodata-images | "Authenticated users can upload" | INSERT | authenticated | ❌ Remove (unused, only Edge Function uploads) |
| biodata-images | "Authenticated users can update" | UPDATE | authenticated | ❌ Remove |
| biodata-images | "Authenticated users can delete" | DELETE | authenticated | ❌ Remove |

**Recommendation:** Keep 2 policies (public read + service_role write), remove 3 authenticated policies.

---

## MIGRATION FILES - WHAT TO DO

### Historical Migrations (Problematic)
```
supabase/migrations/20260205121205_13020069-6fde-4965-ae49-c10fbe276e81.sql  (Initial)
supabase/migrations/20260206042737_ad61a5c9-e700-45c0-a4d0-e0a171d10122.sql  (Vulnerable RLS added)
supabase/migrations/20260206120000_fix_storage_policies.sql                  (Storage changes)
supabase/migrations/20260206125000_force_create_admin_settings.sql           (Duplicate columns)
supabase/migrations/20260206130000_fix_admin_settings_rls.sql                (False security comment)
supabase/migrations/20260206161500_reset_password.sql                        (Bcrypt hash)
supabase/migrations/20260206163000_plaintext_reset.sql                       (Plaintext password!)
supabase/migrations/20260206164500_add_social_links.sql                      (Duplicate column)
supabase/migrations/20260206231000_enable_exec_sql.sql                       (Emergency function)
supabase/migrations/20260208222700_add_hero_image_position.sql               (Duplicate column)
```

**Action:**
- ❌ **DELETE** all 10 files (they're on the old Supabase project)
- ✅ **CREATE** 1 new clean baseline migration (see below)
- Keep only the new baseline for the new Supabase project

### Synthetic Migration
```
supabase/migrations/20260209000000_complete_schema.sql  (I created this)
```

**Action:**
- ❌ **DELETE** (perpetuates vulnerabilities)

---

## NEW BASELINE MIGRATION (TO CREATE)

### File: `supabase/migrations/20260209000000_initial_secure_schema.sql`

Should include:
- ✅ CREATE TABLE sections (unchanged)
- ✅ CREATE TABLE images (unchanged)
- ✅ CREATE TABLE admin_settings (with all columns, no password_hash seed)
- ✅ CREATE VIEW site_settings_public (excludes password_hash)
- ✅ RLS policies (fixed: anon can only read view, not main table)
- ✅ Storage bucket + 2 policies (public read + service_role write)
- ✅ Timestamp triggers
- ✅ Seed: 9 sections + 1 admin_settings row with NULL password_hash
- ❌ NO exec_sql function
- ❌ NO password hash seed (password must be set via setup flow)

---

## EDGE FUNCTIONS - DEPLOYMENT REQUIREMENTS

All 4 functions must be deployed to new Supabase project:

### 1. `admin-auth/index.ts`
**Changes needed:**
- Add handling for NULL password (requiresSetup response)
- Add 'setup-password' action
- Rest of code unchanged

**Environment:**
- Reads: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- Uses: bcryptjs library (already in package.json)

**Deploy:** `npx wrangler deploy`

### 2. `admin-sections/index.ts`
**Changes:** None needed
**Deploy:** `npx wrangler deploy`

### 3. `admin-settings/index.ts`
**Changes:** None needed (still updates admin_settings table)
**Deploy:** `npx wrangler deploy`

### 4. `admin-upload/index.ts`
**Changes:** None needed
**Deploy:** `npx wrangler deploy`

---

## EDGE FUNCTIONS USE ENVIRONMENT VARIABLES

Each Edge Function uses:
```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
```

**Automatic Setup:**
- When you deploy via `wrangler deploy` to Supabase, it automatically:
  1. Detects that you're using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  2. Provisions these from the Supabase project
  3. Injects them into the function environment
- ✅ **You don't need to manually set these**

---

## SECRETS THAT MUST BE CONFIGURED IN NEW SUPABASE PROJECT

### Required
1. **SUPABASE_URL** (automatically available in new project)
   - Example: `https://ektofyrvnqoxojomnong.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY** (automatically available in new project)
   - Generated by Supabase
   - Used by Edge Functions
   - ❌ NEVER commit to git
   - ❌ NEVER share

### NOT Required (public keys, safe in git)
- VITE_SUPABASE_PROJECT_ID
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_SUPABASE_URL

---

## FRONTEND UPDATES REQUIRED

### Change 1: useAdminSettings hook
```typescript
// OLD (reads from admin_settings)
const { data: settings, error } = await supabase
  .from('admin_settings')
  .select('*')
  .single();

// NEW (reads from view)
const { data: settings, error } = await supabase
  .from('site_settings_public')
  .select('*')
  .single();
```

### Change 2: Admin setup modal
- Detect when password is NULL (requiresSetup=true from login response)
- Show password setup form
- Call admin-auth with action='setup-password'

### Change 3: Update env vars
- Change VITE_SUPABASE_URL to new project URL
- Change VITE_SUPABASE_PUBLISHABLE_KEY to new project key
- Change VITE_SUPABASE_PROJECT_ID to new project ID

---

## EXACT ORDER OF OPERATIONS

### Phase 1: LOCAL PREPARATION (NO REMOTE CHANGES YET)

1. ✅ **Delete old migrations**
   - Delete supabase/migrations/20260205121205_*.sql through 20260208222700_*.sql

2. ✅ **Delete synthetic migration**
   - Delete supabase/migrations/20260209000000_complete_schema.sql

3. ✅ **Create new baseline migration**
   - Create supabase/migrations/20260209000000_initial_secure_schema.sql (detailed below)

4. ✅ **Update Edge Function: admin-auth**
   - Add setup-password action
   - Add requiresSetup detection

5. ✅ **Update TypeScript types**
   - Add hero_image_position, is_privacy_mode, social_links to admin_settings
   - Add site_settings_public type

6. ✅ **Update useAdminSettings hook**
   - Read from site_settings_public instead of admin_settings

7. ✅ **Create AdminSetupModal component**
   - Form to set initial password

8. ✅ **Update AdminLoginModal**
   - Detect requiresSetup and show setup modal instead

9. ✅ **Update .env**
   - Change to NEW Supabase project URL/keys

10. ✅ **Test locally**
    - `npm run build` (verify TypeScript compiles)
    - Check no errors in console

### Phase 2: REMOTE SUPABASE SETUP (NEW PROJECT)

11. ✅ **Open new Supabase project**
    - Go to: https://app.supabase.com/projects

12. ✅ **Open SQL Editor**
    - Click: SQL Editor

13. ✅ **Run baseline migration**
    - Copy entire supabase/migrations/20260209000000_initial_secure_schema.sql
    - Paste into SQL Editor
    - Click Run
    - Verify: no errors, tables created

14. ✅ **Deploy Edge Functions**
    - From command line: `npx wrangler deploy`
    - Verify: all 4 functions deployed

15. ✅ **Verify schema**
    - Run query:
    ```sql
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='public' 
    ORDER BY table_name;
    ```
    - Expect: admin_settings, images, sections, site_settings_public

### Phase 3: FRONTEND DEPLOYMENT

16. ✅ **Deploy frontend**
    - Push to GitHub
    - Wrangler deploys to Cloudflare Workers
    - Or use your deployment pipeline

17. ✅ **Test in browser**
    - Visit app URL
    - Verify: sections load (public read works)
    - Click admin button
    - Verify: setup modal appears (no password yet)
    - Set new admin password
    - Verify: can log in
    - Verify: admin panel works

---

## EXACT SQL FOR NEW BASELINE MIGRATION

See next section (separate file to keep organized).

---

## VALIDATION BEFORE RUNNING SQL

Before you execute the migration SQL on the new Supabase project, locally verify:

```bash
# 1. TypeScript compiles without errors
npm run build

# 2. Check for hardcoded secrets
grep -r "admin123" src/ supabase/
grep -r "password_hash" src/
grep -r "SERVICE_ROLE_KEY" .env .env.local || echo "✓ No service role key in env files"

# 3. Verify .env has NEW project values
cat .env | grep VITE_SUPABASE_URL

# 4. Check migration file exists and is clean
wc -l supabase/migrations/20260209000000_initial_secure_schema.sql
```

---

## FINAL CHECKLIST - DO NOT DEPLOY UNTIL ALL MARKED ✅

- [ ] ✅ Old migrations deleted (20260205-20260208)
- [ ] ✅ Synthetic migration deleted (20260209 old version)
- [ ] ✅ New baseline migration created (20260209 new version)
- [ ] ✅ admin-auth function updated (setup-password action)
- [ ] ✅ TypeScript types updated (missing columns added)
- [ ] ✅ useAdminSettings reads from site_settings_public
- [ ] ✅ AdminSetupModal created
- [ ] ✅ .env updated with NEW Supabase project values
- [ ] ✅ npm run build succeeds (no TypeScript errors)
- [ ] ✅ No hardcoded passwords in code
- [ ] ✅ No SUPABASE_SERVICE_ROLE_KEY in git
- [ ] ✅ New baseline migration SQL verified (no syntax errors)
- [ ] ✅ Ready to run migration in SQL Editor

---

## WHAT NOT TO DO

- ❌ Do NOT use the synthetic complete_schema.sql I created
- ❌ Do NOT run historical migrations (20260205-20260208)
- ❌ Do NOT keep plaintext password in migrations
- ❌ Do NOT expose password_hash to anon users
- ❌ Do NOT commit SUPABASE_SERVICE_ROLE_KEY to git
- ❌ Do NOT keep authenticated write policies on storage
- ❌ Do NOT keep exec_sql function in production
- ❌ Do NOT run anything on remote until all local checks pass

---

## NEXT STEP

1. Review this document
2. Confirm you want to proceed with security fixes
3. I will provide:
   - Exact new baseline migration SQL
   - Exact code changes needed (admin-auth, hooks, components)
   - Step-by-step deployment script

**Question for you:**
Do you want me to proceed with creating the secure baseline migration and all required code changes?

