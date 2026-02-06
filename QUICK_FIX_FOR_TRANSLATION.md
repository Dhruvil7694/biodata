# Quick Fix for Translation Issue

## The Problem

When you toggle language, only the **values** translate but not the **field names** (keys).

Example:
- English: "Age: 25 years"
- Gujarati: "Age: 25 વર્ષ" ❌ (Should be "ઉંમર: 25 વર્ષ" ✅)

## Root Cause

The Gujarati content in the database has **English keys** instead of Gujarati keys.

**What's stored (WRONG):**
```json
// content_gu
{
  "Age": "25 વર્ષ",          // ❌ Key is in English
  "Height": "5'8\"",          // ❌ Key is in English
  "Education": "B.Tech"       // ❌ Key is in English
}
```

**What should be stored (CORRECT):**
```json
// content_gu
{
  "ઉંમર": "25 વર્ષ",          // ✅ Key is in Gujarati
  "ઊંચાઈ": "5'8\"",           // ✅ Key is in Gujarati
  "શિક્ષણ": "B.Tech"          // ✅ Key is in Gujarati
}
```

## Solution

### Step 1: Enable Auto-Translate in Admin Panel

1. Open admin panel (tap hero image 7 times, enter password)
2. Click "Edit" on any section with key-value data
3. Make sure "Auto-Translate" toggle is **ON** (should be gold/yellow)
4. The toggle is in the top-right area of the edit dialog

### Step 2: Re-enter or Verify Data

For each section with key-value data (Personal Details, Education, etc.):

1. Click "Edit" on the section
2. Make sure you're in "Fields" mode (not "Text" mode)
3. For each field row, check:
   - **Label (EN)**: Should have English label (e.g., "Age")
   - **લેબલ (GU)**: Should have Gujarati label (e.g., "ઉંમર")
   - **Value (EN)**: Should have English value (e.g., "25 years")
   - **કિંમત (GU)**: Should have Gujarati value (e.g., "25 વર્ષ")

4. If "લેબલ (GU)" is empty or in English:
   - Delete the content in "લેબલ (GU)" field
   - Wait 1 second (auto-translate will fill it)
   - OR manually type the Gujarati translation

5. Click "Save Changes"

### Step 3: Test

1. Go to main page
2. Toggle between EN and ગુ
3. **Both field names AND values should now translate**

## Common Field Translations

Use these if auto-translate doesn't work:

| English | Gujarati |
|---------|----------|
| Age | ઉંમર |
| Height | ઊંચાઈ |
| Weight | વજન |
| Education | શિક્ષણ |
| Degree | ડિગ્રી |
| Occupation | વ્યવસાય |
| Job | નોકરી |
| Salary | પગાર |
| Income | આવક |
| Father | પિતા |
| Mother | માતા |
| Brother | ભાઈ |
| Sister | બહેન |
| Family | પરિવાર |
| Location | સ્થાન |
| City | શહેર |
| Village | ગામ |
| Native | વતન |
| Hobby | શોખ |
| Interest | રુચિ |
| Name | નામ |
| Birth | જન્મ |
| Date of Birth | જન્મ તારીખ |

## Alternative: Manual Database Fix

If you have many sections to fix, you can:

1. Export current data
2. Find-replace English keys with Gujarati keys in `content_gu` column
3. Re-import data

But the admin panel method above is easier and safer.

## Verification

After fixing, when you toggle language:
- ✅ Section titles change
- ✅ Field names change (Age → ઉંમર)
- ✅ Field values change (25 years → 25 વર્ષ)
- ✅ Everything translates end-to-end

## Still Having Issues?

If translation still doesn't work after following these steps:

1. Check browser console for errors (F12 → Console tab)
2. Verify data is saved correctly (edit section again and check fields)
3. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Clear browser cache

If problem persists, please share:
- Screenshot of admin panel showing the field data
- Screenshot of the page in English
- Screenshot of the page in Gujarati
