import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('admin forms match the secure Supabase schema', () => {
  it('site settings form fields exist in the migration and Edge Function allow-list', () => {
    const migration = readProjectFile('supabase/migrations/20260209000000_initial_secure_schema.sql');
    const functionSource = readProjectFile('supabase/functions/admin-settings/index.ts');

    const settingsFields = [
      'site_title',
      'hero_image_url',
      'hero_image_urls',
      'hero_image_position',
      'is_privacy_mode',
      'social_links',
    ];

    settingsFields.forEach((field) => {
      expect(migration).toContain(field);
      expect(functionSource).toContain(`'${field}'`);
    });

    expect(functionSource).not.toContain('password_hash');
    expect(functionSource).not.toContain('admin_settings');
  });

  it('section editor fields are translated into language-row columns before saving', () => {
    const migration = readProjectFile('supabase/migrations/20260209000000_initial_secure_schema.sql');
    const functionSource = readProjectFile('supabase/functions/admin-sections/index.ts');

    ['title', 'subtitle', 'content', 'order_index', 'visible', 'language'].forEach((field) => {
      expect(migration).toContain(field);
    });

    ['title_en', 'title_gu', 'content_en', 'content_gu', 'type'].forEach((uiField) => {
      expect(functionSource).toContain(uiField);
    });

    expect(functionSource).toContain('buildLanguageRows');
    expect(functionSource).toContain("language: 'en'");
    expect(functionSource).toContain("language: 'gu'");
  });

  it('image model uses the current images.url column name', () => {
    const migration = readProjectFile('supabase/migrations/20260209000000_initial_secure_schema.sql');
    const appTypes = readProjectFile('src/lib/types.ts');
    const sectionImageType = appTypes.match(/export interface SectionImage \{[\s\S]*?\n\}/)?.[0] || '';

    expect(migration).toContain('url varchar(1024)');
    expect(sectionImageType).toContain('url: string | null');
    expect(sectionImageType).not.toContain('image_url');
  });
});
