# Quick Fix Reference Card

## 🚨 Most Common Issue: Edge Functions Not Deployed

### Quick Fix (Windows PowerShell)
```powershell
.\deploy-and-test.ps1
```

### Quick Fix (Windows CMD)
```cmd
deploy.bat
```

### Manual Fix
```bash
npx supabase login
npx supabase link --project-ref gyupyuyiilwfewzusoix
npx supabase functions deploy admin-auth
npx supabase functions deploy admin-sections
npx supabase functions deploy admin-settings
```

## 🔍 Quick Test

```bash
node test-edge-function.js
```

Expected output:
```
✅ SUCCESS: Login works with default password!
```

## 🔑 Default Credentials

- **Password**: `admin123`
- **Change it after first login!**

## 📊 Visual Diagnostics

Add to your app temporarily:

```tsx
import { DiagnosticPanel } from '@/components/admin/DiagnosticPanel';

// In your component
<DiagnosticPanel />
```

## ⚡ Quick Checks

### 1. Check Environment Variables
```bash
type .env
```
Should see:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_PUBLISHABLE_KEY

### 2. Check Supabase CLI
```bash
npx supabase --version
```

### 3. Check Project Link
```bash
npx supabase status
```

### 4. Check Edge Functions
```bash
npx supabase functions list
```

## 🐛 Common Errors

| Error | Fix |
|-------|-----|
| "Failed to fetch" | Deploy Edge Functions |
| "Invalid password" | Run VERIFY_AND_FIX_HASH.sql |
| "Server configuration error" | Check Supabase env vars |
| "Failed to read admin settings" | Run INSERT_DEFAULT_DATA.sql |
| 404 on Edge Function | Redeploy functions |

## 📝 Files to Use

| Problem | File |
|---------|------|
| Need to deploy | `deploy-and-test.ps1` or `deploy.bat` |
| Need to test | `test-edge-function.js` |
| Password issues | `VERIFY_AND_FIX_HASH.sql` |
| Need full guide | `FIX_ALL_ISSUES.md` |
| Want diagnostics | `DiagnosticPanel.tsx` |

## 🎯 Success Criteria

- [ ] `node test-edge-function.js` passes all tests
- [ ] Login works with 'admin123'
- [ ] No errors in browser console
- [ ] DiagnosticPanel shows all green ✅

## 📞 Debug Commands

```bash
# View Edge Function logs
npx supabase functions logs admin-auth

# Check database connection
npx supabase db ping

# View project info
npx supabase status
```

## 🔐 Security Reminder

After fixing:
1. Change default password immediately
2. Use strong password (12+ characters)
3. Don't commit passwords to git
4. Monitor Edge Function logs for suspicious activity

---

**Need more help?** See `FIXES_APPLIED.md` for detailed explanations.
