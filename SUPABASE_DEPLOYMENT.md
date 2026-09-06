# Supabase Deployment Guide

This document provides the exact Supabase CLI commands needed to deploy the new secure schema to your Supabase project.

## Prerequisites

- Supabase project created: `ektofyrvnqoxojomnong`
- Supabase CLI installed: `npm install -g supabase`
- Supabase account authenticated

## Environment Variables (Cloudflare Workers)

These are **frontend-safe** variables only (available in `wrangler.json` or `.env`):

```
VITE_SUPABASE_URL=https://ektofyrvnqoxojomnong.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your_publishable_key>
```

**Important:** Do NOT add SUPABASE_SERVICE_ROLE_KEY to frontend environment variables or git.

## Supabase Secrets (Edge Functions Only)

These must be configured as **Supabase secrets** and are ONLY available inside Edge Functions:

### 1. ADMIN_BOOTSTRAP_TOKEN

The one-time token required to initialize the admin account on first setup.

```bash
npx supabase secrets set ADMIN_BOOTSTRAP_TOKEN="<secure-random-token>"
```

**Generate a secure token:**
```bash
# On Linux/macOS:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Save this token securely (outside git, send to admin via secure channel).

### 2. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

**Automatically available** in Supabase Edge Functions. You don't need to set these; Supabase provides them.

To verify they're configured:
```bash
npx supabase secrets list
```

## Deployment Steps

### Step 1: Login to Supabase

```bash
npx supabase login
```

Follow the prompts to authenticate with your Supabase account.

### Step 2: Link to Your Project

```bash
npx supabase link --project-ref ektofyrvnqoxojomnong
```

This creates a `.supabase` directory with project configuration.

### Step 3: Push the Database Schema

```bash
npx supabase db push
```

This runs the migration file `20260209000000_initial_secure_schema.sql` and creates:
- `sections` table (public content, visible-based access)
- `images` table (linked to sections)
- `site_settings` table (public configuration)
- `admin_credentials` table (sensitive, server-only access)
- Storage bucket `biodata-images` with appropriate policies
- RLS policies for all tables
- Seed data for sections and site_settings

### Step 4: Set the Bootstrap Token Secret

```bash
npx supabase secrets set ADMIN_BOOTSTRAP_TOKEN="your-secure-token-here"
```

Replace `your-secure-token-here` with the token generated in the Prerequisites section.

### Step 5: Deploy Edge Functions

Deploy each function individually:

```bash
npx supabase functions deploy admin-auth
npx supabase functions deploy admin-sections
npx supabase functions deploy admin-settings
npx supabase functions deploy admin-upload
```

Verify deployment:
```bash
npx supabase functions list
```

### Step 6: Deploy Frontend to Cloudflare

```bash
npm run build
npx wrangler deploy
```

## Verification Checklist

After deployment, verify:

- [ ] Database schema created: `npx supabase db pull` shows 4 tables
- [ ] Storage bucket exists: `biodata-images` visible in Supabase dashboard
- [ ] Edge Functions deployed: All 4 functions show in dashboard
- [ ] Bootstrap token configured: `npx supabase secrets list` shows `ADMIN_BOOTSTRAP_TOKEN`
- [ ] Frontend built: `dist/` folder contains `index.html`
- [ ] Frontend deployed: App loads at your Cloudflare URL
- [ ] RLS policies active: Check "Authentication" > "Policies" in Supabase dashboard

## First-Time Admin Setup

1. Visit your deployed app in browser
2. Click on admin button (usually in header or footer)
3. A setup modal appears
4. Enter the bootstrap token (provided by administrator)
5. Set your admin password (min 8 characters)
6. Click "Initialize"
7. Bootstrap is complete, you can now log in normally

## Troubleshooting

### "admin_credentials table not found"
- Verify migration ran: `npx supabase db pull`
- Check that no other migrations exist in `/migrations/` folder
- Run migration manually via SQL Editor if needed

### "Edge Functions not found"
- Verify functions deployed: `npx supabase functions list`
- Check function logs: `npx supabase functions fetch admin-auth --log-token <token>`

### "Bootstrap token rejected"
- Verify token set: `npx supabase secrets list`
- Compare token entered with token set in secrets
- Token is case-sensitive

### "Password too weak"
- Frontend requires minimum 8 characters
- Edge Function requires bcryptjs compatibility (no special character limitations)

## Security Notes

1. **Bootstrap Token**: Generated once, distributed securely. Not stored in git or .env.
2. **Service Role Key**: Only used inside Edge Functions. Never exposed to frontend.
3. **Password Hash**: Stored using bcryptjs (10 rounds). Not reversible.
4. **admin_credentials**: Completely hidden from browser via RLS policies.
5. **site_settings**: Public read-only. Safe for anonymous users to access.

## Command Reference

| Command | Purpose |
|---------|---------|
| `npx supabase login` | Authenticate with Supabase account |
| `npx supabase link --project-ref <ref>` | Connect to specific project |
| `npx supabase db push` | Run pending migrations |
| `npx supabase db pull` | Download schema from remote project |
| `npx supabase secrets list` | View configured secrets |
| `npx supabase secrets set KEY="value"` | Set a secret |
| `npx supabase functions deploy <name>` | Deploy an Edge Function |
| `npx supabase functions list` | List all deployed functions |

## What Changed from Previous Architecture

| Aspect | Old | New |
|--------|-----|-----|
| Schema | 1 `admin_settings` table | 2 tables: `site_settings` + `admin_credentials` |
| Password | Mixed in public table | Isolated in credentials table |
| RLS | Allowed anon SELECT on password_hash | Blocks all access to credentials |
| Edge Functions | Used `admin_settings` | Uses `admin_credentials` |
| Bootstrap | Plaintext password in migration | One-time token required |
| Fallback | Plaintext password auto-upgrade | No fallback, secure bootstrap only |
| Storage | Authenticated upload policy | Service-role only (Edge Functions) |

