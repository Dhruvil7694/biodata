# Translation Testing Guide

## How the Translation System Works

The translation system works by storing **separate data for each language** in the database:

### Database Structure:
- `title_en` - English title
- `title_gu` - Gujarati title  
- `content_en` - English content (can be text or JSON)
- `content_gu` - Gujarati content (can be text or JSON)

### When You Toggle Language:
The app switches between `content_en` and `content_gu` columns.

## Example Data Storage

### For Text Sections (About, Philosophy, etc.):
**English (`content_en`):**
```
I am a warm-hearted individual who believes in the beauty of simple moments.
```

**Gujarati (`content_gu`):**
```
હું એક સ્નેહાળ વ્યક્તિ છું જે સાદી ક્ષણોની સુંદરતા અને અર્થપૂર્ણ જોડાણોમાં માને છે.
```

### For Key-Value Sections (Personal Details, Education, etc.):
**English (`content_en`):**
```json
{
  "Age": "25 years",
  "Height": "5'8\"",
  "Education": "B.Tech Computer Science",
  "Occupation": "Software Engineer"
}
```

**Gujarati (`content_gu`):**
```json
{
  "ઉંમર": "25 વર્ષ",
  "ઊંચાઈ": "5'8\"",
  "શિક્ષણ": "B.Tech કમ્પ્યુટર સાયન્સ",
  "વ્યવસાય": "સોફ્ટવેર એન્જિનિયર"
}
```

## Testing Steps

1. **Open the Application:**
   - Go to http://localhost:8082/

2. **Check English Version:**
   - Make sure language toggle shows "EN" as active
   - Scroll through all sections
   - Note down which sections have data

3. **Switch to Gujarati:**
   - Click the "ગુ" button in the top-right
   - Scroll through all sections again
   - **BOTH field names AND values should change**

4. **What Should Translate:**
   ✅ Section titles (About Me → મારા વિશે)
   ✅ Section content (paragraphs)
   ✅ Field names in key-value sections (Age → ઉંમર)
   ✅ Field values in key-value sections (if entered in Gujarati)
   ✅ Social media labels (WhatsApp → વોટ્સએપ)
   ✅ UI elements (Loading, Call, Email, etc.)

## Common Issues

### Issue 1: Only Values Translate, Not Field Names
**Cause:** The Gujarati content (`content_gu`) has English keys.

**Example of WRONG data:**
```json
// content_gu (WRONG - keys are in English)
{
  "Age": "25 વર્ષ",
  "Height": "5'8\"",
  "Education": "B.Tech કમ્પ્યુટર સાયન્સ"
}
```

**Example of CORRECT data:**
```json
// content_gu (CORRECT - keys are in Gujarati)
{
  "ઉંમર": "25 વર્ષ",
  "ઊંચાઈ": "5'8\"",
  "શિક્ષણ": "B.Tech કમ્પ્યુટર સાયન્સ"
}
```

**Solution:** In the admin panel, when using "Fields" mode:
1. Enter English label in "Label (EN)" field
2. Enter Gujarati label in "લેબલ (GU)" field
3. The auto-translate feature should fill Gujarati labels automatically

### Issue 2: Nothing Translates
**Cause:** Data not entered in both languages.

**Solution:** Make sure you fill in BOTH English and Gujarati fields in the admin panel.

### Issue 3: Some Sections Don't Translate
**Cause:** Those sections might be using "Text" mode instead of "Fields" mode.

**Solution:** In admin panel, check if the section is in "Text" or "Fields" mode. Both should work if data is entered in both languages.

## Checking Your Current Data

To see what's actually stored in the database:

1. Open admin panel (tap hero image 7 times)
2. Edit a section
3. Check if both English and Gujarati fields have data
4. For "Fields" mode, check if Gujarati labels (લેબલ) are filled

## Expected Behavior

When you toggle from EN to ગુ:
- **Everything visible on screen should change**
- Field names should change (Age → ઉંમર)
- Field values should change (if entered in Gujarati)
- Section titles should change
- Section content should change
- UI labels should change (WhatsApp → વોટ્સએપ)

## If Translation Still Doesn't Work

Please provide:
1. Screenshot of the page in English
2. Screenshot of the page in Gujarati
3. Screenshot of the admin panel showing the data for one section
4. Which specific sections are not translating

This will help identify the exact issue.
