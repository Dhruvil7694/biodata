// @ts-ignore: Deno imports
import { serve } from "http/server.ts";
// @ts-ignore: Deno imports
import { createClient } from "supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  );
}

function dbErrorResponse(error: any, fallback: string) {
  const message = error?.message || fallback;
  const code = error?.code;

  console.error(fallback, error);
  return jsonResponse({ error: message, code }, 400);
}

function sectionTypeToTitle(type: string | undefined, fallback: string | null | undefined) {
  if (fallback) return fallback;

  switch (type) {
    case 'contact':
      return 'Contact';
    case 'family':
      return 'Family';
    case 'career':
      return 'Education';
    case 'lifestyle':
      return 'Interests';
    case 'goals':
      return 'Goals';
    case 'philosophy':
      return 'Philosophy';
    default:
      return 'About';
  }
}

function buildLanguageRows(section: any, orderIndex: number) {
  return [
    {
      title: sectionTypeToTitle(section.type, section.title_en),
      subtitle: null,
      content: section.content_en ?? '',
      order_index: orderIndex,
      visible: section.visible ?? true,
      language: 'en',
    },
    {
      title: section.title_gu || section.title_en || sectionTypeToTitle(section.type, null),
      subtitle: null,
      content: section.content_gu ?? section.content_en ?? '',
      order_index: orderIndex,
      visible: section.visible ?? true,
      language: 'gu',
    },
  ];
}

async function findSectionGroup(supabase: any, sectionId: string) {
  const { data: base, error } = await supabase
    .from('sections')
    .select('id, order_index, language, visible')
    .eq('id', sectionId)
    .single();

  if (error) return { base: null, rows: null, error };

  const { data: rows, error: rowsError } = await supabase
    .from('sections')
    .select('id, language')
    .eq('order_index', base.order_index);

  return { base, rows, error: rowsError };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // @ts-ignore: Deno runtime
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore: Deno runtime
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, section, id, orderedIds } = await req.json();

    console.log(`Admin sections action: ${action}`);

    // List all sections (including hidden)
    if (action === 'list') {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        return dbErrorResponse(error, 'Failed to fetch sections');
      }

      return new Response(
        JSON.stringify({ sections: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update a section
    if (action === 'update') {
      const { id: sectionId, ...updateData } = section;
      const { base, rows, error: groupError } = await findSectionGroup(supabase, sectionId);

      if (groupError || !base || !rows) {
        return dbErrorResponse(groupError, 'Failed to find section');
      }

      const hasContentUpdate = (
        'title_en' in updateData ||
        'title_gu' in updateData ||
        'content_en' in updateData ||
        'content_gu' in updateData ||
        'type' in updateData
      );

      const updates = hasContentUpdate
        ? buildLanguageRows({ ...updateData, visible: updateData.visible ?? base.visible }, base.order_index).map((row) => {
          const existing = rows.find((candidate: any) => candidate.language === row.language);

          if (existing) {
            return supabase
              .from('sections')
              .update(row)
              .eq('id', existing.id);
          }

          return supabase
            .from('sections')
            .insert(row);
        })
        : rows.map((row: any) =>
          supabase
            .from('sections')
            .update({ visible: updateData.visible })
            .eq('id', row.id)
        );

      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);

      if (failed) {
        return dbErrorResponse(failed.error, 'Failed to update section');
      }

      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('id', sectionId)
        .single();

      if (error) {
        return dbErrorResponse(error, 'Failed to update section');
      }

      console.log(`Section ${sectionId} updated`);

      return new Response(
        JSON.stringify({ section: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a new section
    if (action === 'create') {
      const rows = buildLanguageRows(section, section.order_index ?? 0);
      const { data, error } = await supabase
        .from('sections')
        .insert(rows)
        .select();

      if (error) {
        return dbErrorResponse(error, 'Failed to create section');
      }

      console.log('Section created:', data?.[0]?.id);

      return new Response(
        JSON.stringify({ section: data?.[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete a section
    if (action === 'delete') {
      const { base, error: groupError } = await findSectionGroup(supabase, id);

      if (groupError || !base) {
        return dbErrorResponse(groupError, 'Failed to find section');
      }

      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('order_index', base.order_index);

      if (error) {
        return dbErrorResponse(error, 'Failed to delete section');
      }

      console.log(`Section ${id} deleted`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Duplicate a section
    if (action === 'duplicate') {
      const { base, error: groupError } = await findSectionGroup(supabase, id);

      if (groupError || !base) {
        return dbErrorResponse(groupError, 'Failed to fetch section');
      }

      const { data: originals, error: fetchError } = await supabase
        .from('sections')
        .select('*')
        .eq('order_index', base.order_index);

      if (fetchError) {
        return dbErrorResponse(fetchError, 'Failed to fetch section');
      }

      const originalEn = originals.find((row: any) => row.language === 'en') || originals[0];
      const originalGu = originals.find((row: any) => row.language === 'gu') || originalEn;

      // Get max order index
      const { data: maxSection } = await supabase
        .from('sections')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const newOrderIndex = (maxSection?.order_index ?? 0) + 1;

      // Create duplicate
      const { data: duplicate, error: insertError } = await supabase
        .from('sections')
        .insert([
          {
            title: `${originalEn.title || 'Section'} (Copy)`,
            subtitle: originalEn.subtitle,
            content: originalEn.content,
            order_index: newOrderIndex,
            visible: originalEn.visible,
            language: 'en',
          },
          {
            title: `${originalGu.title || originalEn.title || 'વિભાગ'} (નકલ)`,
            subtitle: originalGu.subtitle,
            content: originalGu.content,
            order_index: newOrderIndex,
            visible: originalGu.visible,
            language: 'gu',
          },
        ])
        .select();

      if (insertError) {
        return dbErrorResponse(insertError, 'Failed to duplicate section');
      }

      console.log(`Section ${id} duplicated as ${duplicate?.[0]?.id}`);

      return new Response(
        JSON.stringify({ section: duplicate?.[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reorder sections
    if (action === 'reorder') {
      const groups = await Promise.all(
        orderedIds.map((sectionId: string) =>
          supabase
            .from('sections')
            .select('id, order_index')
            .eq('id', sectionId)
            .single()
        )
      );

      const groupFetchError = groups.find(result => result.error);
      if (groupFetchError) {
        return dbErrorResponse(groupFetchError.error, 'Failed to reorder sections');
      }

      const tempOffset = 10000;
      const tempUpdates = groups.map((result: any, index: number) =>
        supabase
          .from('sections')
          .update({ order_index: tempOffset + index })
          .eq('order_index', result.data.order_index)
      );

      const tempResults = await Promise.all(tempUpdates);
      const tempError = tempResults.find(r => r.error);
      if (tempError) {
        return dbErrorResponse(tempError.error, 'Failed to reorder sections');
      }

      // Update both language rows for each displayed section.
      const updates = groups.map((_: any, index: number) =>
        supabase
          .from('sections')
          .update({ order_index: index })
          .eq('order_index', tempOffset + index)
      );

      const results = await Promise.all(updates);

      const updateError = results.find(r => r.error);
      if (updateError) {
        return dbErrorResponse(updateError.error, 'Failed to reorder sections');
      }

      console.log('Sections reordered');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return jsonResponse({ error: 'Invalid action' }, 400);

  } catch (error) {
    console.error('Admin sections error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Server error' }, 500);
  }
});
