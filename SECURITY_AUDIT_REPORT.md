# SECURITY & MIGRATION AUDIT REPORT
**Project:** elegant-bios (Matrimonial Biodata)  
**Date:** February 9, 2026  
**Status:** ⚠️ CRITICAL SECURITY ISSUES FOUND - DO NOT DEPLOY YET

---

## EXECUTIVE SUMMARY

**CRITICAL SECURITY VULNERABILITY FOUND:**

The `admin_settings` table, which contains `password_hash`, is readable by anonymous (unauthenticated) users via RLS policy:

```sql
CREATE POLICY "Anyone can read admin settings" 
ON public.admin_settings 
FOR SELECT 
TO anon, authenticated
USING (true);
```

This policy allows `SELECT *` from anyone, exposing `password_hash` to every visitor.

**Additionally:**
1. Historical migrations store plaintext password 'admin123' in database
2. Synthetic complete_schema migration perpetuates these vulnerabilities
3. Existing migration chain has conflicts and redundancy
4. Frontend unnecessarily reads password_hash via SELECT *

**RECOMMENDATION:** Do not run migrations as-is. Security fixes required first.

---

## PART 1: MIGRATION CHAIN AUDIT

### Migration Timeline (11 files, chronological order)

#### Migration 1: `20260205121205_13020069-6fde-4965-ae49-c10fbe276e81.sql`
**Created:** Feb 5, 2026  
**Objects:**
- CREATE TABLE `sections` (10 columns)
- CREATE TABLE `images` (5 columns)
- CREATE TABLE `admin_settings` (6 columns)
- RLS: sections, images, admin_settings ENABLED
- Policies:
  - sections: public SELECT (visible=true), service_role ALL
  - images: public SELECT (visible sections only), service_role ALL
  - admin_settings: service_role ALL ONLY (no public read)
- Triggers: update_updated_at_column function + 2 triggers
- Storage: biodata-images bucket + 4 policies (public read, service_role write)
- Seed: 1 admin_settings row (bcrypt hash), 9 sections

**Dependencies:** None (initial migration)

**Issues:**
- ⚠️ Storage policy "Service role can upload/update/delete" redundant (service_role bypasses RLS anyway)

---

#### Migration 2: `20260206042737_ad61a5c9-e700-45c0-a4d0-e0a171d10122.sql`
**Created:** Feb 6, 2026  
**Objects:**
- DROP + recreate sections policies (identical, just explicit role specification)
- DROP + recreate images policies (identical, just explicit role specification)
- **🔴 NEW CRITICAL POLICY:** "Anyone can read hero image"
  ```sql
  CREATE POLICY "Anyone can read hero image" 
  ON public.admin_settings 
  FOR SELECT 
  TO anon, authenticated
  USING (true);
  ```
  This allows anon to SELECT all columns including password_hash!

**Dependencies:** Migration 1

**Issues:**
- 🔴 CRITICAL: Exposes password_hash to anonymous users
- Redundant policy changes (same logic, just explicit role TO clauses)

---

#### Migration 3: `20260206120000_fix_storage_policies.sql`
**Created:** Feb 6, 2026  
**Objects:**
- Ensures biodata-images bucket exists and is public
- Drops 5 storage policies, recreates 5 new ones with more granular roles
- Adds "Authenticated users can upload/update/delete"

**Dependencies:** Migration 1

**Issues:**
- Changes storage policies to allow "authenticated" users to upload
- This may not be intended - app appears to only use service_role for uploads

---

#### Migration 4: `20260206125000_force_create_admin_settings.sql`
**Created:** Feb 6, 2026  
**Objects:**
- CREATE TABLE IF NOT EXISTS admin_settings (adds new columns not in M1):
  - is_privacy_mode BOOLEAN
  - social_links JSONB
  - (hero_image_url already existed)
- RLS ENABLE (idempotent)
- Creates policies using DO block with IF NOT EXISTS
- Seed: 1 admin_settings row with plaintext password 'admin123'

**Dependencies:** Migration 1 (or can run fresh)

**Issues:**
- 🔴 INSECURE: Stores plaintext password 'admin123' in password_hash field
- Uses DO/IF NOT EXISTS, but policies created are not restrictive (allows anon read)
- Adds columns not mentioned in initial migration

---

#### Migration 5: `20260206130000_fix_admin_settings_rls.sql`
**Created:** Feb 6, 2026  
**Objects:**
- Adds policy "Anyone can read admin settings" using DO/IF NOT EXISTS
- **Comment claims security is OK:**
  ```
  'Allows anon role to read admin_settings. Password hash is safe to expose 
   as it is bcrypt hashed. Authentication is handled by Edge Function with 
   service_role key.'
  ```

**Dependencies:** Migrations 1-4

**Issues:**
- 🔴 CRITICAL: False security assumption. Bcrypt hash should never be visible to anon users
- Enables brute-force attacks on password hash
- Violates principle of least privilege
- Comment documents the wrong decision

---

#### Migration 6: `20260206161500_reset_password.sql`
**Created:** Feb 6, 2026  
**Objects:**
- UPDATE admin_settings SET password_hash = '$2b$10$gXnGXVc58l4PhOkaziiWZ.NOIdrYuwPZGVZOpwEeE9O00AE5pt04XK'

**Dependencies:** Migrations 1-5

**Issues:**
- Updates to a valid bcryptjs hash
- Still committed to git repo (if committed - check git history)

---

#### Migration 7: `20260206163000_plaintext_reset.sql`
**Created:** Feb 6, 2026  
**Objects:**
- UPDATE admin_settings SET password_hash = 'admin123'

**Dependencies:** Migrations 1-6

**Issues:**
- 🔴 INSECURE: Stores plaintext password 'admin123' in password_hash field
- Edge Function code has fallback to detect plaintext and auto-upgrade to bcrypt
- Dangerous practice: plaintext password in database

---

#### Migration 8: `20260206164500_add_social_links.sql`
**Created:** Feb 6, 2026  
**Objects:**
- ALTER TABLE admin_settings ADD COLUMN social_links JSONB

**Dependencies:** Migrations 1-7

**Issues:**
- Adds column; idempotent (IF NOT EXISTS)
- Duplicates column added in Migration 4

---

#### Migration 9: `20260206231000_enable_exec_sql.sql`
**Created:** Feb 6, 2026  
**Objects:**
- CREATE FUNCTION exec_sql(sql_query TEXT) with SECURITY DEFINER
- Grants EXECUTE to service_role only
- Explicitly revokes from public, anon, authenticated

**Dependencies:** Migrations 1-8

**Issues:**
- ⚠️ Emergency function for raw SQL execution
- Should be removed in production
- Code comment says "Remove after use or secure properly"

---

#### Migration 10: `20260208222700_add_hero_image_position.sql`
**Created:** Feb 8, 2026  
**Objects:**
- ALTER TABLE admin_settings ADD COLUMN hero_image_position TEXT

**Dependencies:** Migrations 1-9

**Issues:**
- Adds column; idempotent
- Column duplicated in Migration 4

---

### Migration Chain Summary Table

| # | File | Date | Key Changes | Status |
|---|------|------|-------------|--------|
| 1 | 13020069... | 2/5 | Initial schema (3 tables, policies, storage) | ✅ Clean |
| 2 | ad61a5c9... | 2/6 | Add anon SELECT to admin_settings | 🔴 Vulnerable |
| 3 | fix_storage... | 2/6 | Update storage policies + add authenticated write | ⚠️ Questionable |
| 4 | force_create... | 2/6 | Add columns (is_privacy_mode, social_links) | 🔴 Plaintext pwd |
| 5 | fix_admin_rls | 2/6 | Codify anon read policy + false security comment | 🔴 Vulnerable |
| 6 | reset_password | 2/6 | Update to bcryptjs hash | ✅ OK |
| 7 | plaintext_reset | 2/6 | Reset to plaintext 'admin123' | 🔴 INSECURE |
| 8 | add_social_links | 2/6 | Add social_links column (duplicate) | ⚠️ Redundant |
| 9 | enable_exec_sql | 2/6 | Create exec_sql function (emergency only) | ⚠️ Should remove |
| 10 | add_hero_image_position | 2/8 | Add hero_image_position column (duplicate) | ⚠️ Redundant |

**Can historical chain run on fresh DB?** 
✅ **YES, BUT WITH VULNERABILITIES.** All CREATE TABLE IF NOT EXISTS and idempotent operations. However, the schema will have security issues (password_hash exposed, plaintext password in DB).

---

## PART 2: SYNTHETIC COMPLETE_SCHEMA REVIEW

### File: `supabase/migrations/20260209000000_complete_schema.sql`

**What it does:**
- CREATE TABLE IF NOT EXISTS (all 3 tables)
- Drops and recreates all RLS policies from scratch
- Recreates timestamp triggers
- Recreates storage bucket and policies
- Inserts seed data

**Comparison Against Historical Chain:**

| Object | Historical Chain | Synthetic Migration | Match? |
|--------|------------------|--------------------|-|
| sections table | ✅ Created in M1, never changed | ✅ Identical CREATE | ✅ Yes |
| images table | ✅ Created in M1, never changed | ✅ Identical CREATE | ✅ Yes |
| admin_settings columns | ✅ Added across M1, M4, M8, M10 | ✅ All columns included | ✅ Yes |
| admin_settings policy for anon | ✅ M2/M5 creates `(true)` allowing all | ✅ Same `(true)` | ✅ Yes (🔴 BUG) |
| sections/images policies | ✅ Refined in M2 | ✅ Same as M2 | ✅ Yes |
| Timestamp triggers | ✅ Created in M1 | ✅ Recreated, dropped first | ⚠️ Risky |
| Storage bucket | ✅ M1 creates, M3 updates public | ✅ Creates with public=true | ✅ Yes |
| Storage policies | ✅ M1, M3 create 5-7 policies | ⚠️ Only 2 policies | ❌ Reduced |
| Seed data (password_hash) | ✅ M1 bcrypt, M4 plaintext, M6 bcrypt, M7 plaintext | 🔴 Uses old bcrypt from M1 | ❌ Wrong |
| Seed data (sections) | ✅ M1 inserts 9 rows (unchanged) | ✅ Same 9 rows | ✅ Yes |

**Issues:**

🔴 **CRITICAL ISSUE 1: Same password_hash policy vulnerability**
- Synthetic migration preserves the flawed policy that allows anon SELECT on password_hash
- Same `USING (true)` with no column filtering

🔴 **CRITICAL ISSUE 2: Plaintext password seed**
- Synthetic migration seeds password_hash with bcrypt, but:
  - App migrations reset it to plaintext multiple times
  - Edge Function expects this and auto-upgrades
  - But the synthetic migration uses an old bcrypt hash
  - **Risk:** App will try to read plaintext, fail, and potentially cause issues

⚠️ **ISSUE 3: Storage policies reduced**
- Historical M3 creates 5 storage policies
- Synthetic only creates 2 policies
- Missing: "Authenticated users can upload/update/delete"
- **Risk:** If the app depends on authenticated storage access, it will fail

⚠️ **ISSUE 4: Trigger recreation**
- Synthetic drops and recreates triggers
- If run alongside historical migrations, triggers will be dropped/recreated multiple times
- Safe but inefficient

---

## PART 3: ADMIN_SETTINGS SECURITY VULNERABILITY

### Vulnerability Details

**The Problem:**

The RLS policy on `admin_settings` table:
```sql
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (true);
```

**Allows:**
- Anonymous users (unauthenticated visitors) to execute: SELECT * FROM admin_settings
- Returns ALL columns: id, password_hash, site_title, hero_image_url, hero_image_position, is_privacy_mode, social_links, created_at, updated_at
- password_hash is readable by every visitor

**Attack Vectors:**
1. **Brute-force:** Attacker downloads password_hash, offline brute-forces with wordlist
2. **Timing attack:** Attacker can measure bcrypt comparison time to guess password
3. **Information leak:** Exposure of admin credentials is always a security risk
4. **Privilege escalation:** If password_hash is leaked, admin account is compromised

**Why the comment is wrong:**
- Migration M5 claims: "Password hash is safe to expose as it is bcrypt hashed"
- **FALSE.** Bcrypt is slow by design (cost=10), but:
  - Offline brute force is still viable with commodity hardware
  - ~150 billion bcrypt iterations per day on modern GPU
  - 'admin123' is guessable within minutes
  - Hash exposure should never happen regardless of algorithm

**Current Frontend Behavior:**
```typescript
// src/hooks/useAdminSettings.ts
const { data: settings, error } = await supabase
  .from('admin_settings')
  .select('*')  // ← Reads ALL columns including password_hash
  .single();
```

Frontend reads password_hash unnecessarily, and as an anon user (public page), this returns the hash to the browser.

---

## PART 4: ADMIN AUTHENTICATION ARCHITECTURE

### How Admin Auth Currently Works

**1. Frontend Login Flow:**
```typescript
// User submits plaintext password
const response = await supabase.functions.invoke('admin-auth', {
  body: { action: 'login', password: userInput }
});
```

**2. Edge Function (`admin-auth`) on server:**
```typescript
// Reads password_hash from DB using service_role key
const { data: settings } = await supabase
  .from('admin_settings')
  .select('password_hash')
  .single();

// Compares plaintext password with hash using bcryptjs
const isValid = await bcrypt.compare(password, settings.password_hash);

// Returns { success: true/false }
```

**3. Authentication is server-side (correct approach)**
- Password never sent as plaintext to DB
- Verification happens in Edge Function with service_role access
- Frontend never sees the hash (during login)

**BUT:**
- Vulnerability: Frontend CAN read password_hash via RLS policy, just not during login
- A malicious user or compromised frontend could read it directly
- The architecture is mostly correct, but RLS policy shouldn't allow anon SELECT

### Default Password Risk

Migration M7 sets password to plaintext 'admin123', and the Edge Function handles this:
```typescript
// Fallback: Check for plaintext if bcrypt failed
if (!isValid && settings.password_hash === password) {
  console.warn('Password matched as plaintext — upgrading to hash');
  isValid = true;
  // Auto-fixes: generates bcrypt hash and updates DB
}
```

**Risk:** 
- If DB contains plaintext 'admin123', it can be read directly via SQL
- The 'admin123' is in git history (migrations)
- Default password should be:
  - Generated randomly (not 'admin123')
  - Never committed to git
  - Provided via environment variable or secure bootstrap

---

## PART 5: EDGE FUNCTIONS INVENTORY

| Function | Purpose | Tables Used | Environment Vars | Deployment Required? | Frontend Calls? |
|----------|---------|-------------|------------------|----------------------|-----------------|
| admin-auth | Admin login + password change | admin_settings | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | ✅ YES | ✅ YES (useAdminAuth hook) |
| admin-sections | List/create/update/delete sections | sections | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | ✅ YES | ✅ YES (SectionEditor) |
| admin-settings | Update site settings | admin_settings | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | ✅ YES | ✅ YES (useAdminSettings) |
| admin-upload | Upload images to storage | storage.objects | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | ✅ YES | ✅ YES (HeroImageManager) |

**Critical Requirement:** All 4 Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` and must be deployed to the new Supabase project. The functions will NOT work with old project key.

**Environment Setup:**
In the new Supabase project:
1. Create/note SUPABASE_URL
2. Create/note SUPABASE_SERVICE_ROLE_KEY
3. Deploy Edge Functions using `npx wrangler deploy`
4. Functions will automatically get these env vars from Supabase

---

## PART 6: RLS AUDIT BY TABLE & ROLE

### Current RLS Policies (As-Is)

#### `sections` Table
| Policy Name | Action | Roles | Condition | Risk |
|-------------|--------|-------|-----------|------|
| "Anyone can view visible sections" | SELECT | anon, authenticated | visible=true | ✅ Safe |
| "Service role can manage all sections" | ALL | service_role | true | ✅ Intended |

**Assessment:** ✅ Correct. Public reads only visible sections. Admin can do everything.

#### `images` Table
| Policy Name | Action | Roles | Condition | Risk |
|-------------|--------|-------|-----------|------|
| "Anyone can view images of visible sections" | SELECT | anon, authenticated | section.visible=true | ✅ Safe |
| "Service role can manage all images" | ALL | service_role | true | ✅ Intended |

**Assessment:** ✅ Correct. Same as sections.

#### `admin_settings` Table (CURRENT - VULNERABLE)
| Policy Name | Action | Roles | Condition | Risk |
|-------------|--------|-------|-----------|------|
| "Anyone can read admin settings" | SELECT | anon, authenticated | true | 🔴 CRITICAL |
| "Service role can manage admin settings" | ALL | service_role | true | ✅ Intended |

**Assessment:** 🔴 Critical. Allows anon to read password_hash. Should be:
- Either allow anon SELECT on specific safe columns only
- Or restrict to service_role only

#### `storage.objects` (biodata-images bucket)
| Policy Name | Action | Roles | Condition | Risk |
|-------------|--------|-------|-----------|------|
| "Anyone can view biodata images" | SELECT | public, anon, authenticated | bucket_id='biodata-images' | ✅ Safe |
| "Service role can manage biodata images" | ALL | service_role | bucket_id='biodata-images' | ✅ Intended |
| "Authenticated users can upload biodata images" | INSERT | authenticated | bucket_id='biodata-images' | ⚠️ Allow |
| "Authenticated users can update biodata images" | UPDATE | authenticated | bucket_id='biodata-images' | ⚠️ Allow |
| "Authenticated users can delete biodata images" | DELETE | authenticated | bucket_id='biodata-images' | ⚠️ Allow |

**Assessment:** 
- ✅ Public read is correct
- ⚠️ Authenticated write policies allow ANY authenticated user to upload/modify images
  - App doesn't seem to use these (only Edge Function)
  - Could be left for future expansion or should be removed

---

## PART 7: STORAGE AUDIT

### Current Setup
- Bucket: `biodata-images` (public=true)
- Purpose: Store hero images and section images

### Policies (Current)
1. Public read: Anyone can view
2. Service role: Can do everything
3. Authenticated: Can upload/update/delete (questionable)

### Assessment
- ✅ Public read is appropriate for a portfolio
- ⚠️ Authenticated write allows any logged-in user (doesn't exist in this app)
  - Could be removed since only Edge Function uploads
  - Or left for future if Supabase Auth is added

**Recommendation:** Remove authenticated write policies if admin-only uploads are required.

---

## PART 8: TYPESCRIPT TYPES AUDIT

### File: `src/integrations/supabase/types.ts`

**admin_settings columns in types.ts:**
```typescript
Row: {
  created_at: string
  hero_image_url: string | null
  id: string
  password_hash: string
  site_title: string | null
  updated_at: string
}
```

**Actual columns in database (after all migrations):**
- id ✅
- password_hash ✅
- site_title ✅
- hero_image_url ✅
- hero_image_position (MISSING from types!)
- is_privacy_mode (MISSING from types!)
- social_links (MISSING from types!)
- created_at ✅
- updated_at ✅

**Issue:** Types are stale. They do not include:
- hero_image_position (added M10)
- is_privacy_mode (added M4)
- social_links (added M4, M8)

**Risk:** Frontend code that uses these fields will have TypeScript errors or undefined type.

---

## PART 9: DEFAULT PASSWORD INSECURITY

### Current State
- Migration M7 sets password_hash = 'admin123' (plaintext)
- Synthetic migration seeds with old bcrypt hash
- Edge Function auto-upgrades plaintext to bcrypt

### Problems
1. Plaintext password stored in database (huge risk)
2. Known default password: 'admin123' (anyone can guess)
3. Password in git history (readable to anyone with repo access)
4. Migrations are designed for demo/development, not production

### Required Fixes
1. **Do not use default password 'admin123' in migrations**
2. **Remove all password hashes from git commits**
3. **Generate random initial password or require setup flow**
4. **Never commit SUPABASE_SERVICE_ROLE_KEY to git**

---

## PART 10: SECRETS IN REPOSITORY

### Current State
.env file contains:
```
VITE_SUPABASE_PROJECT_ID="ektofyrvnqoxojomnong"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_o6gdZgQGz26B1VZDe4f2SA_heCIk2Ug"
VITE_SUPABASE_URL="https://ektofyrvnqoxojomnong.supabase.co"
```

### Issues
- ✅ Publishable keys are OK in public repo (read-only anon access)
- ⚠️ Project ID is semi-public (used to identify project)
- 🔴 Service role key is NOT in .env (good!)
- ✅ No plaintext passwords in .env

### Check Needed
- Verify no commits have SUPABASE_SERVICE_ROLE_KEY
- Verify git history doesn't contain password hashes
- Run: `git log --all --full-history -- "*password*" "*secret*" "*key*"`

---

## PART 11: FINAL MIGRATION STRATEGY RECOMMENDATION

### Option A: Apply Historical Migrations Sequentially
**Pros:**
- Exact reproduction of development history
- Preserves all incremental logic
- Easy to debug which migration caused an issue

**Cons:**
- 10 migrations with vulnerabilities and redundancy
- Plaintext password ends up in DB
- Password hash policy exposes admin credentials
- Storage policies allow authenticated write (maybe unintended)
- Duplicated column additions (M4/M8/M10)
- exec_sql function stays in DB (should be removed)
- TypeScript types stay stale

**Verdict:** ❌ NOT RECOMMENDED for production. Too many issues.

---

### Option B: Squash to Clean Baseline Migration
**Pros:**
- Fresh start, no baggage
- Can fix all issues: remove plaintext password, fix RLS, remove exec_sql
- Simpler to audit and understand
- Better for a production deployment

**Cons:**
- Loses development history
- If something breaks, harder to know which historical step caused it
- Requires rewriting migrations to fix vulnerabilities

**Verdict:** ✅ RECOMMENDED with fixes.

---

### ✅ RECOMMENDED STRATEGY: Option B + Security Fixes

**Step 1: Create new baseline migration that includes:**
- All 3 tables with final schema
- Correct RLS policies (password_hash not exposed to anon)
- Storage bucket and correct policies
- Seed data WITHOUT plaintext password
- NO exec_sql function (it's for emergency only, shouldn't be permanent)
- Updated columns (hero_image_position, is_privacy_mode, social_links)

**Step 2: Delete the synthetic complete_schema migration (it has the same issues)**

**Step 3: Create NEW secure migration with fixes (see Part 12)**

**Step 4: Delete all historical migrations (optional, but clean)**

**Step 5: Verify all 11 files with npm/TypeScript**

**Step 6: Deploy Edge Functions**

**Step 7: Update TypeScript types (regenerate or manually fix)**

---

## PART 12: SECURE MIGRATION (TO CREATE)

### admin_settings RLS Policy - FIX

**Current (vulnerable):**
```sql
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (true);  -- ← Exposes password_hash
```

**Fixed Option A: Separate Tables (Cleanest)**
```sql
-- Public settings table (no password)
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title TEXT DEFAULT 'Matrimonial Biodata',
  hero_image_url TEXT,
  hero_image_position TEXT DEFAULT '{"x":50,"y":50}',
  is_privacy_mode BOOLEAN DEFAULT FALSE,
  social_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin credentials table (private)
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: site_settings public read, admin_credentials service_role only
CREATE POLICY "Anyone can read site settings" ON public.site_settings
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role manages site settings" ON public.site_settings
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role only" ON public.admin_credentials
FOR ALL TO service_role USING (true) WITH CHECK (true);
```

**Issue:** Changes app code significantly (separate tables).

---

**Fixed Option B: Column-Level RLS (Simpler)**
```sql
-- Keep admin_settings single table, but restrict what anon can read

-- Drop unsafe policy
DROP POLICY "Anyone can read admin settings" ON public.admin_settings;

-- New policies with role separation

-- Anon can read only public columns
CREATE POLICY "Anon reads public admin settings"
ON public.admin_settings
FOR SELECT
TO anon
USING (true);

-- Authenticated can read only public columns
CREATE POLICY "Authenticated reads admin settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (true);

-- Service role can read everything
CREATE POLICY "Service role manages admin settings"
ON public.admin_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- BUT: Column-level security not natively supported in Supabase/PostgreSQL RLS
-- Must use: SELECT site_title, hero_image_url, social_links, ... FROM admin_settings
```

**Issue:** Frontend must explicitly select safe columns.

---

**Fixed Option C: Use Database View (Best)**
```sql
-- Create view with only public columns
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
FROM public.admin_settings;

-- RLS on view
ALTER TABLE public.site_settings_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings view"
ON public.site_settings_public
FOR SELECT
TO anon, authenticated
USING (true);

-- Frontend reads from view instead of table
SELECT * FROM site_settings_public;  -- No password_hash exposed
```

**Pros:**
- No schema changes
- Frontend changes minimal (site_settings_public instead of admin_settings)
- RLS still protects password_hash
- Service_role can still UPDATE admin_settings directly

---

### ✅ RECOMMENDED: Option C (Database View)

---

## PART 13: PASSWORD BOOTSTRAP (NOT 'admin123')

### Current Risk
Migration hardcodes password hash for 'admin123'.

### Recommended Bootstrap
1. **On fresh database:** Insert NULL or empty password_hash
2. **On first startup:** App detects NULL password
3. **Show setup modal:** Require admin to set password
4. **Hash and save:** Store bcrypt hash in DB
5. **Redirect to admin:** User logs in with their chosen password

### SQL for Bootstrap
```sql
-- Insert empty admin_settings (no password set yet)
INSERT INTO public.admin_settings (password_hash)
SELECT NULL  -- Force setup on first use
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);

-- OR: Insert with a flag
INSERT INTO public.admin_settings (password_hash, site_title)
SELECT 'UNINITIALIZED', 'Matrimonial Biodata'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);
```

### Edge Function Modification
```typescript
if (action === 'login') {
  // Check if password is UNINITIALIZED
  if (settings.password_hash === 'UNINITIALIZED') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Admin account not set up. Please configure password.' 
      }),
      { status: 401 }
    );
  }
  // ... rest of login logic
}
```

---

## SUMMARY TABLE: ISSUES & FIXES

| Issue | Severity | Fix | Effort |
|-------|----------|-----|--------|
| password_hash exposed to anon users | 🔴 CRITICAL | Use database view (Option C) | Medium |
| Plaintext password in migrations | 🔴 CRITICAL | Use bootstrap flow (NULL/UNINITIALIZED) | Medium |
| TypeScript types missing columns | 🟠 HIGH | Regenerate or manually add hero_image_position, is_privacy_mode, social_links | Low |
| Synthetic migration has same issues | 🟠 HIGH | Delete 20260209000000_complete_schema.sql | Low |
| exec_sql function in DB (should be temporary) | 🟠 HIGH | Remove from baseline migration | Low |
| Redundant storage policies (authenticated write) | 🟡 MEDIUM | Review intent, remove if admin-only | Low |
| Duplicate column additions across migrations | 🟡 MEDIUM | Use clean baseline (Option B) | Low |
| Historic password hashes in git | 🟠 HIGH | Audit git history, rewrite if necessary | Medium |

---

## FINAL RECOMMENDATIONS

### ✅ DO NOT RUN
- Historical migrations as-is (vulnerable)
- Synthetic complete_schema.sql (perpetuates vulnerabilities)

### ✅ DO
1. **Create NEW baseline migration** with:
   - All tables (sections, images, admin_settings)
   - View: site_settings_public (password_hash excluded)
   - Fixed RLS policies
   - Proper storage policies
   - Bootstrap password (NULL or UNINITIALIZED)
   - Remove exec_sql function
   - Updated seed data

2. **Update Edge Functions**
   - admin-auth: Check for UNINITIALIZED password, redirect to setup
   - Other functions: No changes needed

3. **Update Frontend**
   - useAdminSettings: Read from site_settings_public (OR add explicit column select)
   - Setup modal: Require password configuration
   - TypeScript types: Regenerate from new schema

4. **Deploy to new Supabase project**
   - Run new baseline migration
   - Deploy 4 Edge Functions
   - Update frontend build with new Supabase URL/key
   - Test login flow

5. **Security Cleanup**
   - Audit git history for secrets
   - Delete old migrations
   - Document bootstrap process

---

## VALIDATION CHECKLIST

Before running ANY migration on new project:

- [ ] password_hash is NOT readable by anon users
- [ ] password_hash is NOT exposed in TypeScript types
- [ ] RLS policies follow least privilege
- [ ] No plaintext passwords in migrations
- [ ] No SUPABASE_SERVICE_ROLE_KEY in git
- [ ] Edge Functions can access SUPABASE_URL and SERVICE_ROLE_KEY
- [ ] Storage bucket allows public read, admin write only
- [ ] Bootstrap flow initializes admin password on first run
- [ ] TypeScript types match final schema
- [ ] All 4 Edge Functions deploy without errors
- [ ] Admin login modal appears on first access
- [ ] Sections display without errors
- [ ] Admin panel works after password setup

---

**STATUS:** 🔴 CRITICAL ISSUES - AUDIT COMPLETE, AWAITING SECURITY FIXES

**NEXT STEP:** Approve security fix strategy before proceeding to implementation.
