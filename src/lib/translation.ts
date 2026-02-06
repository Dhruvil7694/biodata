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
