import { supabase } from '@/integrations/supabase/client';

/**
 * Translation utility for the admin editor.
 *
 * Exact biodata labels are translated locally. Free-form text is batched through
 * the Edge Function so typing in the editor creates one small request burst
 * instead of many parallel requests.
 */
const translationCache = new Map<string, string>();
const pendingTranslations = new Map<string, Array<(value: string) => void>>();
let pendingTranslationTimer: ReturnType<typeof setTimeout> | null = null;
const localGujaratiTranslations: Record<string, string> = {
    'about': 'વિશે',
    'family details': 'પારિવારિક વિગતો',
    'family details (satiya)': 'પારિવારિક વિગતો (સાટિયા)',
    'mosad details': 'મોસાળ વિગતો',
    'mosal details': 'મોસાળ વિગતો',
    'education & career': 'શિક્ષણ અને કારકિર્દી',
    'education and career': 'શિક્ષણ અને કારકિર્દી',
    'contact': 'સંપર્ક',
    'full name': 'પૂર્ણ નામ',
    'date of birth': 'જન્મ તારીખ',
    'place of birth': 'જન્મ સ્થળ',
    'age': 'ઉંમર',
    'height': 'ઊંચાઈ',
    'weight': 'વજન',
    'blood group': 'બ્લડ ગ્રુપ',
    'caste / subcaste': 'જાતિ / પેટા જાતિ',
    'rashi': 'રાશિ',
    'current city': 'વર્તમાન શહેર',
    'highest qualification': 'સર્વોચ્ચ લાયકાત',
    'field': 'ક્ષેત્ર',
    'university': 'યુનિવર્સિટી',
    'year of graduation': 'ગ્રેજ્યુએશન વર્ષ',
    'current occupation': 'વર્તમાન વ્યવસાય',
    'company': 'કંપની',
    'industry / sector': 'ઇન્ડસ્ટ્રી / સેક્ટર',
    'work location': 'કામનું સ્થળ',
    "father's name": 'પિતાનું નામ',
    "father's occupation": 'પિતાનો વ્યવસાય',
    "mother's name": 'માતાનું નામ',
    "mother's occupation": 'માતાનો વ્યવસાય',
    "sister's name": 'બહેનનું નામ',
    "sister's occupation": 'બહેનનું અભ્યાસ',
    'family type': 'પરિવારનો પ્રકાર',
    'native place': 'વતન',
    'late grandfather': 'સ્વ. દાદા',
    'late grandmother': 'સ્વ. દાદી',
    'maternal uncle 1 (mama)': 'મામા 1',
    'maternal uncle 2 (mama)': 'મામા 2',
    'mama 1': 'મામા 1',
    'mama 2': 'મામા 2',
    'mama 3': 'મામા 3',
    'masi 1': 'માસી 1',
    'masi 2': 'માસી 2',
    'masi 3': 'માસી 3',
    'residence': 'રહેઠાણ',
    'kemraj': 'કેમરાજ',
    'athwa umra, surat': 'અઠવા ઉમરા, સુરત',
    'athwa umra': 'અઠવા ઉમરા',
    'pune': 'પુણે',
    'surat': 'સુરત',
    'dhanu / sagittarius': 'ધનુ / Sagittarius',
    'nuclear': 'ન્યુક્લિયર',
    'housewife': 'ગૃહિણી',
    'diamond business & agriculture': 'ડાયમંડ બિઝનેસ અને એગ્રીકલ્ચર',
    'ai engineer': 'AI Engineer',
    'software': 'Software',
    'dhruvil hirenbhai patel': 'ધ્રુવિલ હિરેનભાઈ પટેલ',
    'hirenbhai rameshbhai patel': 'હિરેનભાઈ રમેશભાઈ પટેલ',
    'darshanaben hirenbhai patel': 'દર્શનાબેન હિરેનભાઈ પટેલ',
    'dhruvi hirenbhai patel': 'ધ્રુવી હિરેનભાઈ પટેલ',
    'bharatbhai dayabhai patel': 'ભારતભાઈ દયાભાઈ પટેલ',
    'geetaben bharatbhai patel': 'ગીતાબેન ભારતભાઈ પટેલ',
    'hiralbhai bharatbhai patel (athwa umra)': 'હિરલભાઈ ભારતભાઈ પટેલ (અઠવા ઉમરા)',
    'hetalbhai bharatbhai patel (kemraj char rasta)': 'હેતલભાઈ ભારતભાઈ પટેલ (કેમરાજ ચાર રસ્તા)',
    'hetalbhai bharatbhai patel': 'હેતલભાઈ ભારતભાઈ પટેલ',
    'hiralbhai bharatbhai patel': 'હિરલભાઈ ભારતભાઈ પટેલ',
    'poonamben bharatbhai patel': 'પૂનમબેન ભારતભાઈ પટેલ',
    'mulad': 'મુલાડ',
    'hindu lal chuda kadva patidar': 'હિન્દુ લાલ ચુડા કડવા પાટીદાર',
    'b.tech information technology & engineering (it&e)': 'B.Tech Information Technology & Engineering (IT&E)',
    'artificial intelligence (ai)': 'Artificial Intelligence (AI)',
    'p. p savani university': 'P. P Savani University',
    'ey gds': 'EY GDS',
    "ongoing bachelor's in computer engineering": "Computer Engineering માં ચાલુ Bachelor's",
    'this is the interests section. share your hobbies and interests.': 'આ રુચિઓનો વિભાગ છે. તમારા શોખ અને રુચિઓ શેર કરો.',
};

const phraseReplacements: Array<[RegExp, string]> = [
    [/\bmosad\b/gi, 'મોસાળ'],
    [/\bmosal\b/gi, 'મોસાળ'],
    [/\bmama\b/gi, 'મામા'],
    [/\bmasi\b/gi, 'માસી'],
    [/\bdetails\b/gi, 'વિગતો'],
    [/\bsection\b/gi, 'વિભાગ'],
    [/\bshare\b/gi, 'શેર કરો'],
    [/\byour\b/gi, 'તમારા'],
    [/\bhobbies\b/gi, 'શોખ'],
    [/\bhobby\b/gi, 'શોખ'],
    [/\binterests\b/gi, 'રુચિઓ'],
    [/\binterest\b/gi, 'રુચિ'],
    [/\bfamily\b/gi, 'પરિવાર'],
    [/\beducation\b/gi, 'શિક્ષણ'],
    [/\bcareer\b/gi, 'કારકિર્દી'],
    [/\bcontact\b/gi, 'સંપર્ક'],
    [/\babout\b/gi, 'વિશે'],
    [/\bname\b/gi, 'નામ'],
    [/\boccupation\b/gi, 'વ્યવસાય'],
    [/\bresidence\b/gi, 'રહેઠાણ'],
    [/\bcurrent\b/gi, 'વર્તમાન'],
    [/\bcity\b/gi, 'શહેર'],
    [/\bnative\b/gi, 'વતન'],
    [/\bplace\b/gi, 'સ્થળ'],
    [/\bbirth\b/gi, 'જન્મ'],
    [/\bdate\b/gi, 'તારીખ'],
    [/\bthis is\b/gi, 'આ છે'],
    [/\bthe\b/gi, ''],
    [/\band\b/gi, 'અને'],
];

function buildLocalTranslation(text: string): string {
    let translated = text.trim();
    let changed = false;

    phraseReplacements.forEach(([pattern, replacement]) => {
        const next = translated.replace(pattern, replacement);
        if (next !== translated) changed = true;
        translated = next;
    });

    return changed
        ? translated.replace(/\s{2,}/g, ' ').replace(/\s+([.,])/g, '$1').trim()
        : '';
}

function flushPendingTranslations() {
    const entries = Array.from(pendingTranslations.entries());
    pendingTranslations.clear();
    pendingTranslationTimer = null;

    const texts = entries.map(([text]) => text);

    supabase.functions.invoke('translate-gujarati', {
        body: { texts },
    }).then(({ data, error }) => {
        const translatedTexts = Array.isArray(data?.translatedTexts) ? data.translatedTexts : [];

        entries.forEach(([text, resolvers], index) => {
            const translatedText = typeof translatedTexts[index] === 'string' ? translatedTexts[index] : '';
            translationCache.set(text.toLowerCase(), translatedText);
            resolvers.forEach(resolve => resolve(translatedText));
        });

        if (error) {
            console.warn('Gujarati translation unavailable; keeping editable text unchanged.', error);
        }
    }).catch((error) => {
        entries.forEach(([text, resolvers]) => {
            translationCache.set(text.toLowerCase(), '');
            resolvers.forEach(resolve => resolve(''));
        });
        console.warn('Gujarati translation unavailable; keeping editable text unchanged.', error);
    });
}

function queueRemoteTranslation(text: string): Promise<string> {
    return new Promise((resolve) => {
        const existing = pendingTranslations.get(text);
        if (existing) {
            existing.push(resolve);
        } else {
            pendingTranslations.set(text, [resolve]);
        }

        if (pendingTranslationTimer) clearTimeout(pendingTranslationTimer);
        pendingTranslationTimer = setTimeout(flushPendingTranslations, 200);
    });
}

export async function translateToGujarati(text: string): Promise<string> {
    if (!text || text.trim() === '') return '';
    const trimmedText = text.trim();
    const cacheKey = trimmedText.toLowerCase();
    const localTranslation = localGujaratiTranslations[cacheKey];

    if (localTranslation) {
        translationCache.set(cacheKey, localTranslation);
        return localTranslation;
    }

    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey) || '';
    }

    const generatedTranslation = buildLocalTranslation(text);
    if (generatedTranslation) {
        translationCache.set(cacheKey, generatedTranslation);
        return generatedTranslation;
    }

    return queueRemoteTranslation(trimmedText);
}

// Static translations for common UI elements
export const translations = {
    en: {
        // Social Media Platforms
        instagram: 'Instagram',
        facebook: 'Facebook',
        twitter: 'Twitter',
        linkedin: 'LinkedIn',
        github: 'GitHub',
        whatsapp: 'WhatsApp',
        youtube: 'YouTube',
        email: 'Email',
        website: 'Website',

        // Common Labels
        socialProfiles: 'Social Profiles',
        loading: 'Loading...',
        somethingWentWrong: 'Something went wrong',
        unableToLoad: 'Unable to load content. Please try again later.',
        explore: 'Explore',
        call: 'Call',
        years: 'Years',
        months: 'Months',
        days: 'Days',

        // Achievement
        universitygoldmedalist: 'University Gold Medalist',
        academicexcellence: 'Academic Excellence',

        // Common Field Names (for key-value pairs)
        age: 'Age',
        height: 'Height',
        weight: 'Weight',
        nationality: 'Nationality',
        location: 'Location',
        city: 'City',
        address: 'Address',
        native: 'Native Place',
        place: 'Place',
        village: 'Village',
        mosar: 'Native Village',
        education: 'Education',
        degree: 'Degree',
        occupation: 'Occupation',
        job: 'Job',
        career: 'Career',
        work: 'Work',
        salary: 'Salary',
        income: 'Income',

        // Family Fields
        father: 'Father',
        "father's name": "Father's Name",
        "fathers name": "Father's Name",
        family: 'Family',
        "family name": "Family Name",
        "family residence": "Family Residence",
        mother: 'Mother',
        "mother's name": "Mother's Name",
        "mothers name": "Mother's Name",
        brother: 'Brother',
        sister: 'Sister',
        sibling: 'Sibling',
        "sibling's": "Sibling's",
        "sibling name": "Sibling Name",
        siblings: "Siblings",

        // Maternal Family
        "maternal grandfather": "Maternal Grandfather",
        "maternal grandmother": "Maternal Grandmother",
        "maternal uncle 1": "Maternal Uncle 1",
        "maternal uncle 2": "Maternal Uncle 2",
        "maternal uncle 3": "Maternal Uncle 3",
        "maternal aunty 1": "Maternal Aunty 1",
        "maternal aunty 2": "Maternal Aunty 2",
        "maternal aunty 3": "Maternal Aunty 3",

        // Paternal Family
        "paternal grandfather": "Paternal Grandfather",
        "paternal grandmother": "Paternal Grandmother",
        "paternal uncle 1": "Paternal Uncle 1",
        "paternal uncle 2": "Paternal Uncle 2",
        "paternal uncle 3": "Paternal Uncle 3",
        "paternal aunty 1": "Paternal Aunty 1",
        "paternal aunty 2": "Paternal Aunty 2",
        "paternal aunty 3": "Paternal Aunty 3",

        // Other Common Fields
        residence: "Residence",
        hobby: 'Hobby',
        hobbies: 'Hobbies',
        interest: 'Interest',
        interests: 'Interests',
        about: 'About',
        intro: 'Introduction',
        name: 'Name',
        philosophy: 'Philosophy',
        goal: 'Goal',
        goals: 'Goals',
        birth: 'Birth',
        dob: 'Date of Birth',
        birthdate: 'Birth Date',
    },
    gu: {
        // Social Media Platforms
        instagram: 'ઇન્સ્ટાગ્રામ',
        facebook: 'ફેસબુક',
        twitter: 'ટ્વિટર',
        linkedin: 'લિંક્ડઇન',
        github: 'ગિટહબ',
        whatsapp: 'વોટ્સએપ',
        youtube: 'યુટ્યુબ',
        email: 'ઈમેલ',
        website: 'વેબસાઇટ',

        // Common Labels
        socialProfiles: 'સોશિયલ પ્રોફાઇલ્સ',
        loading: 'લોડ થઈ રહ્યું છે...',
        somethingWentWrong: 'કંઈક ખોટું થયું',
        unableToLoad: 'સામગ્રી લોડ કરવામાં અસમર્થ. કૃપા કરીને પછીથી પ્રયાસ કરો.',
        explore: 'તપાસો',
        call: 'કોલ કરો',
        years: 'વર્ષ',
        months: 'મહિના',
        days: 'દિવસ',

        // Achievement
        universitygoldmedalist: 'યુનિવર્સિટી ગોલ્ડ મેડલિસ્ટ',
        academicexcellence: 'શૈક્ષણિક શ્રેષ્ઠતા',

        // Common Field Names (for key-value pairs)
        age: 'ઉંમર',
        height: 'ઊંચાઈ',
        weight: 'વજન',
        nationality: 'રાષ્ટ્રીયતા',
        location: 'સ્થાન',
        city: 'શહેર',
        address: 'સરનામું',
        native: 'વતન',
        place: 'સ્થળ',
        village: 'ગામ',
        mosar: 'મોસર',
        education: 'શિક્ષણ',
        degree: 'ડિગ્રી',
        occupation: 'વ્યવસાય',
        job: 'નોકરી',
        career: 'કારકિર્દી',
        work: 'કામ',
        salary: 'પગાર',
        income: 'આવક',

        // Family Fields
        father: 'પિતા',
        "father's name": 'પિતાનું નામ',
        "fathers name": 'પિતાનું નામ',
        family: 'પરિવાર',
        "family name": 'પરિવારનું નામ',
        "family residence": 'પરિવારનું રહેઠાણ',
        mother: 'માતા',
        "mother's name": 'માતાનું નામ',
        "mothers name": 'માતાનું નામ',
        brother: 'ભાઈ',
        sister: 'બહેન',
        sibling: 'ભાઈ-બહેન',
        "sibling's": 'ભાઈ-બહેનની સંખ્યા',
        "sibling name": 'ભાઈ-બહેનનું નામ',
        siblings: 'ભાઈ-બહેનો',

        // Maternal Family
        "maternal grandfather": 'મામાના પિતા',
        "maternal grandmother": 'મામાની માતા',
        "maternal uncle 1": 'મામા ૧',
        "maternal uncle 2": 'મામા ૨',
        "maternal uncle 3": 'મામા ૩',
        "maternal aunty 1": 'માસી ૧',
        "maternal aunty 2": 'માસી ૨',
        "maternal aunty 3": 'માસી ૩',

        // Paternal Family
        "paternal grandfather": 'દાદા',
        "paternal grandmother": 'દાદી',
        "paternal uncle 1": 'કાકા ૧',
        "paternal uncle 2": 'કાકા ૨',
        "paternal uncle 3": 'કાકા ૩',
        "paternal aunty 1": 'કાકી ૧',
        "paternal aunty 2": 'કાકી ૨',
        "paternal aunty 3": 'કાકી ૩',

        // Other Common Fields
        residence: 'રહેઠાણ',
        hobby: 'શોખ',
        hobbies: 'શોખ',
        interest: 'રુચિ',
        interests: 'રુચિઓ',
        about: 'વિશે',
        intro: 'પરિચય',
        name: 'નામ',
        philosophy: 'ફિલસૂફી',
        goal: 'ધ્યેય',
        goals: 'લક્ષ્યો',
        birth: 'જન્મ',
        dob: 'જન્મ તારીખ',
        birthdate: 'જન્મ તારીખ',
    }
};

// Helper function to get translation
export function t(key: string, language: 'en' | 'gu'): string {
    const normalizedKey = key.toLowerCase().trim();
    return translations[language][normalizedKey as keyof typeof translations.en] || key;
}
