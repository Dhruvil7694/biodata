# Translation System Guide

## Overview
The application now has a comprehensive English to Gujarati translation system that translates **everything** on the main page, including:
- Section titles and content (from database)
- Field names/labels (Age, Height, Education, etc.)
- Social media platform names (Instagram, Facebook, etc.)
- UI elements (Loading, Call, Email, etc.)
- Achievement badges
- All static text

## How It Works

### 1. Database Content (Sections)
Content is stored in both languages in the database:
- `title_en` / `title_gu` - Section titles
- `content_en` / `content_gu` - Section content

When you enter data in the admin panel, you provide both English and Gujarati versions.

### 2. Static UI Elements
All UI labels, field names, and platform names are translated using the `t()` function from `src/lib/translation.ts`.

The translation file contains a comprehensive dictionary of common terms:
- Social media platforms (Instagram → ઇન્સ્ટાગ્રામ)
- Field names (Age → ઉંમર, Education → શિક્ષણ)
- UI labels (Loading → લોડ થઈ રહ્યું છે)
- Action words (Call → કોલ કરો, Email → ઈમેલ)

### 3. Key-Value Pairs
When you enter data as JSON in the admin panel (for sections like Personal Details, Education, etc.), the **field names** are automatically translated.

Example:
```json
{
  "Age": "25",
  "Height": "5'8\"",
  "Education": "B.Tech Computer Science"
}
```

When toggled to Gujarati:
- "Age" → "ઉંમર"
- "Height" → "ઊંચાઈ"
- "Education" → "શિક્ષણ"

The **values** remain as entered (so you can enter them in Gujarati in the admin panel).

## Adding New Translations

If you need to add new field names or labels, edit `src/lib/translation.ts`:

```typescript
export const translations = {
    en: {
        yourNewField: 'Your New Field',
        // ... other translations
    },
    gu: {
        yourNewField: 'તમારું નવું ક્ષેત્ર',
        // ... other translations
    }
};
```

## Supported Field Names

The system automatically translates these common field names:

**Personal Info:**
- Age, Height, Weight, Nationality
- Name, Birth, DOB, Birthdate

**Location:**
- Location, City, Address, Native, Place, Village, Mosar

**Education & Career:**
- Education, Degree, Occupation, Job, Career, Work
- Salary, Income

**Family:**
- Father, Mother, Brother, Sister, Family

**Other:**
- Hobby, Hobbies, Interest, Interests
- About, Intro, Philosophy, Goal, Goals

**Social Media:**
- Instagram, Facebook, Twitter, LinkedIn, GitHub
- WhatsApp, YouTube, Email, Website

## Best Practices

1. **Admin Panel Data Entry:**
   - Enter section titles in both English and Gujarati
   - Enter section content in both English and Gujarati
   - For key-value pairs, use English field names (they'll auto-translate)
   - Enter values in the language you want them displayed

2. **Field Names:**
   - Use standard English field names (Age, Height, etc.)
   - The system will automatically translate them
   - If a field name isn't in the dictionary, it will display as-is

3. **Social Media:**
   - Platform names are automatically translated
   - Use lowercase platform names: instagram, facebook, twitter, etc.

## Testing Translation

1. Open the main page
2. Click the language toggle (EN/ગુ) in the top-right corner
3. Verify that ALL text changes:
   - Section titles
   - Section content
   - Field labels
   - Social media names
   - UI elements (Loading, Call, Email, etc.)
   - Achievement badges

## Technical Details

**Files Modified:**
- `src/lib/translation.ts` - Translation dictionary and helper function
- `src/components/sections/ContentSection.tsx` - Field name translation
- `src/components/SocialIcons.tsx` - Platform name translation
- `src/pages/Index.tsx` - UI element translation
- `src/components/sections/HeroSection.tsx` - Hero section translation

**Translation Function:**
```typescript
t(key: string, language: 'en' | 'gu'): string
```

This function looks up the key in the translation dictionary and returns the appropriate translation based on the current language.
