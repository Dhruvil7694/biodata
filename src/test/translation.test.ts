import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translateToGujarati } from '@/lib/translation';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

describe('Gujarati auto-translation fallback', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('translates common biodata labels locally', async () => {
    await expect(translateToGujarati('Family Details (Satiya)')).resolves.toBe('પારિવારિક વિગતો (સાટિયા)');
    await expect(translateToGujarati('Mosad Details')).resolves.toBe('મોસાળ વિગતો');
    await expect(translateToGujarati('Rashi')).resolves.toBe('રાશિ');
    await expect(translateToGujarati("Father's Name")).resolves.toBe('પિતાનું નામ');
    await expect(translateToGujarati('Mama 1')).resolves.toBe('મામા 1');
    await expect(translateToGujarati('Residence')).resolves.toBe('રહેઠાણ');
    await expect(translateToGujarati('Athwa Umra, Surat')).resolves.toBe('અઠવા ઉમરા, સુરત');
  });

  it('builds simple local translations for common editable content', async () => {
    await expect(translateToGujarati('This is the interests section. Share your hobbies and interests.')).resolves.toBe(
      'આ રુચિઓનો વિભાગ છે. તમારા શોખ અને રુચિઓ શેર કરો.'
    );
  });

  it('batches fully unknown text through the translation function', async () => {
    invokeMock.mockResolvedValue({
      data: { translatedTexts: ['કેટલાક સંપૂર્ણ નવા કસ્ટમ વાક્ય'] },
      error: null,
    });

    await expect(translateToGujarati('Some brand new custom sentence')).resolves.toBe('કેટલાક સંપૂર્ણ નવા કસ્ટમ વાક્ય');
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith('translate-gujarati', {
      body: { texts: ['Some brand new custom sentence'] },
    });
  });
});
