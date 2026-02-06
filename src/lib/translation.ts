/**
 * Simple translation utility using a public translation endpoint.
 * Note: For production use, a dedicated API key and service (like Google Cloud Translate) 
 * would be recommended for reliability and higher limits.
 */

export async function translateToGujarati(text: string): Promise<string> {
    if (!text || text.trim() === '') return '';

    try {
        // Using a public-access Google Translate endpoint
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=gu&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Translation request failed');
        }

        const data = await response.json();

        // The response format is nested arrays: [[["translated_text", "source_text", ...]]]
        if (data && data[0] && Array.isArray(data[0])) {
            return data[0].map((item: any) => item[0]).join('');
        }

        return '';
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
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
