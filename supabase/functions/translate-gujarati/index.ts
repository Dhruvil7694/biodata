// @ts-ignore: Deno imports
import { serve } from "http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const phraseTranslations: Record<string, string> = {
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
  'pune': 'પુણે',
  'surat': 'સુરત',
  'dhanu / sagittarius': 'ધનુ / Sagittarius',
  'nuclear': 'ન્યુક્લિયર',
  'housewife': 'ગૃહિણી',
  'diamond business & agriculture': 'ડાયમંડ બિઝનેસ અને એગ્રીકલ્ચર',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  );
}

async function translateWithGoogleCloud(text: string, apiKey: string): Promise<string> {
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'en',
      target: 'gu',
      format: 'text',
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Cloud Translation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.translations?.[0]?.translatedText || '';
}

async function translateWithPublicGoogle(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=gu&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json,text/plain,*/*',
      'Accept-Language': 'en-US,en;q=0.9,gu;q=0.8',
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Public translation failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.[0])
    ? data[0].map((item: unknown[]) => item?.[0]).filter(Boolean).join('')
    : '';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { text, texts } = await req.json();
    const requestedTexts = Array.isArray(texts) ? texts : [text];

    if (!requestedTexts.every((value) => typeof value === 'string')) {
      return jsonResponse({ error: 'Text/texts must contain strings only' }, 400);
    }

    const trimmedTexts = requestedTexts.map((value: string) => value.trim());
    const translatedTexts = new Array(trimmedTexts.length).fill('');
    const remoteItems: Array<{ index: number; text: string }> = [];

    trimmedTexts.forEach((trimmedText, index) => {
      if (!trimmedText) return;

      const staticTranslation = phraseTranslations[trimmedText.toLowerCase()];
      if (staticTranslation) {
        translatedTexts[index] = staticTranslation;
      } else {
        remoteItems.push({ index, text: trimmedText });
      }
    });

    if (remoteItems.length > 0) {
      const separator = '\n';
      const combinedText = remoteItems.map(({ text }) => text).join(separator);
      const googleCloudApiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
      const translatedText = googleCloudApiKey
        ? await translateWithGoogleCloud(combinedText, googleCloudApiKey)
        : await translateWithPublicGoogle(combinedText);

      const remoteTranslations = translatedText.split(separator);
      remoteItems.forEach(({ index, text }, remoteIndex) => {
        translatedTexts[index] = remoteTranslations[remoteIndex] || text;
      });
    }

    return jsonResponse({
      translatedText: translatedTexts[0] || '',
      translatedTexts,
    });
  } catch (error) {
    console.error('Translation function error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Translation failed' }, 500);
  }
});
