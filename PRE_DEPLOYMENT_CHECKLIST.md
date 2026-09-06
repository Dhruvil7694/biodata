# Pre-Deployment Checklist

**Status:** ✅ All 11 phases complete. Ready for remote deployment.

---

## What Has Been Done (Local Only - No Remote Changes)

- ✅ Deleted 11 historical migrations (preserved in git history)
- ✅ Created 1 clean baseline migration with secure schema
- ✅ Refactored admin-auth Edge Function (admin_credentials + bootstrap)
- ✅ Refactored admin-settings Edge Function (site_settings)
- ✅ Updated TypeScript types (all 4 tables, all columns)
- ✅ Updated frontend hooks (useAdminSettings uses site_settings)
- ✅ Created AdminSetupModal component (bootstrap flow)
- ✅ Updated AdminLoginModal (setup detection)
- ✅ Removed deprecated system check buttons
- ✅ Verified build succeeds (npm run build)
- ✅ Verified no secrets in dist/
- ✅ Validated local security (no admin123, no service role key in git)
- ✅ Created SUPABASE_DEPLOYMENT.md (deployment guide)
- ✅ Created IMPLEMENTATION_REPORT.md (full details)

---

## What You Need to Do Now

### Step 1: Generate Bootstrap Token

Choose one method:

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**On macOS/Linux:**
```bash
openssl rand -base64 32
```

**Result:** A string like `aBcDeFgHiJkLmNoPqRsT1uVwXyZ0aBcDeFgHiJkLm=`

**Save this token securely.** You will need it in Step 4.

### Step 2: Review Documentation

Read these files in order:
1. **SUPABASE_DEPLOYMENT.md** - Exact CLI commands
2. **IMPLEMENTATION_REPORT.md** - Full details of all changes

### Step 3: Execute Deployment Commands

Follow the exact sequence in SUPABASE_DEPLOYMENT.md:

```bash
# 1. Login to Supabase
npx supabase login

# 2. Link to your project
npx supabase link --project-ref ektofyrvnqoxojomnong

# 3. Push database schema (creates tables, RLS, storage)
npx supabase db push

# 4. Set the bootstrap token (replace with your token)
npx supabase secrets set ADMIN_BOOTSTRAP_TOKEN="your-token-here"

# 5. Deploy all 4 Edge Functions
npx supabase functions deploy admin-auth
npx supabase functions deploy admin-sections
npx supabase functions deploy admin-settings
npx supabase functions deploy admin-upload

# 6. Build and deploy frontend
npm run build
npx wrangler deploy
```

**Total time:** 7-11 minutes

### Step 4: Test Bootstrap Flow

1. Open your deployed app in browser
2. Click admin button
3. Enter bootstrap token (from Step 1)
4. Set your admin password (min 8 chars)
5. Verify login works
6. Verify you can edit settings and upload images

### Step 5: Verify Production

Checklist:
- [ ] App loads
- [ ] Bootstrap flow works (token + password setup)
- [ ] Admin login works (password only after bootstrap)
- [ ] Can edit site settings
- [ ] Can upload hero image
- [ ] Can edit sections
- [ ] Public site works (sections visible)
- [ ] No errors in browser console

---

## Files Ready for Deployment

### Database Migration
```
supabase/migrations/20260209000000_initial_secure_schema.sql
```

### Edge Functions (All Ready)
```
supabase/functions/admin-auth/index.ts           ← Refactored
supabase/functions/admin-sections/index.ts       ← No changes
supabase/functions/admin-settings/index.ts       ← Refactored
supabase/functions/admin-upload/index.ts         ← No changes
```

### Frontend (Build Output Ready)
```
dist/index.html                                  ← Ready for Wrangler
dist/assets/                                     ← All assets included
```

---

## Important Reminders

### ⚠️ DO NOT

- ✋ Run the old migrations (they're deleted)
- ✋ Use plaintext password 'admin123' (not accepted)
- ✋ Commit bootstrap token to git
- ✋ Put SUPABASE_SERVICE_ROLE_KEY in frontend code
- ✋ Share bootstrap token via email/chat (provide only out-of-band)
- ✋ Run `npx wrangler deploy` for Supabase functions (use `supabase functions deploy`)

### ✅ DO

- ✓ Follow the deployment commands in exact order
- ✓ Test bootstrap flow immediately after deployment
- ✓ Verify all 4 Edge Functions deployed
- ✓ Verify RLS policies in Supabase dashboard
- ✓ Keep bootstrap token secure (share out-of-band only)
- ✓ Test public site visibility
- ✓ Test admin authentication

---

## Key Changes Summary

| Component | Old | New | Benefit |
|-----------|-----|-----|---------|
| Credentials | admin_settings.password_hash | admin_credentials table | Separation of concerns |
| Admin access | Anon could read password | Blocked by RLS | Security improvement |
| Bootstrap | Plaintext 'admin123' | One-time token | No default password |
| Password | Auto-upgrade plaintext | Bcrypt only | No plaintext fallback |
| Migrations | 10 files with redundancy | 1 clean baseline | No conflicts |
| RLS | Mixed policies | Least privilege matrix | Clear access model |

---

## Support Information

### Troubleshooting

If something goes wrong during deployment, refer to:
- **SUPABASE_DEPLOYMENT.md** - Troubleshooting section
- **IMPLEMENTATION_REPORT.md** - Phase details

### Common Issues

**"admin_credentials table not found"**
→ Verify `npx supabase db push` completed successfully

**"Bootstrap token rejected"**
→ Verify token matches exactly. Case-sensitive.

**"Edge Functions not found"**
→ Verify all 4 functions deployed with `npx supabase functions list`

**"Password doesn't save"**
→ Verify admin-auth and admin-settings functions deployed

---

## Rollback Plan

If needed to revert to previous schema:
```bash
npx supabase db reset
```

This will reset the database to empty state. Then run the appropriate previous migration.

**Note:** We preserved the old migrations in git history for reference.

---

## Next Steps

1. ✅ **You are here** - Review this checklist
2. → **Read SUPABASE_DEPLOYMENT.md** (detailed commands)
3. → **Generate bootstrap token** (Step 1)
4. → **Execute commands** (Step 3)
5. → **Test in browser** (Step 4)
6. → **Verify everything** (Step 5)

---

## Questions?

Refer to the documentation files for answers:
- **SUPABASE_DEPLOYMENT.md** - Deployment questions
- **IMPLEMENTATION_REPORT.md** - Technical questions
- **AUDIT_FINDINGS_SUMMARY.md** - Why these changes were needed (historical context)

---

**Status:** ✅ Ready for deployment
**Validation:** ✅ Complete (local)
**Risk Level:** ✅ Low (all security issues addressed)
**Estimated Duration:** 7-11 minutes
**Required Action:** Execute deployment commands

**Good luck! 🚀**
