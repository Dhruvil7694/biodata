import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
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
        console.error('Error listing sections:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch sections' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ sections: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update a section
    if (action === 'update') {
      const { id: sectionId, ...updateData } = section;
      
      const { data, error } = await supabase
        .from('sections')
        .update(updateData)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating section:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update section' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`Section ${sectionId} updated`);

      return new Response(
        JSON.stringify({ section: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a new section
    if (action === 'create') {
      const { data, error } = await supabase
        .from('sections')
        .insert(section)
        .select()
        .single();

      if (error) {
        console.error('Error creating section:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create section' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Section created:', data.id);

      return new Response(
        JSON.stringify({ section: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete a section
    if (action === 'delete') {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting section:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete section' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`Section ${id} deleted`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Duplicate a section
    if (action === 'duplicate') {
      // Get the section to duplicate
      const { data: original, error: fetchError } = await supabase
        .from('sections')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching section to duplicate:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch section' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

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
        .insert({
          order_index: newOrderIndex,
          visible: original.visible,
          type: original.type,
          title_en: `${original.title_en} (Copy)`,
          title_gu: `${original.title_gu} (નકલ)`,
          content_en: original.content_en,
          content_gu: original.content_gu,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error duplicating section:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to duplicate section' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`Section ${id} duplicated as ${duplicate.id}`);

      return new Response(
        JSON.stringify({ section: duplicate }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reorder sections
    if (action === 'reorder') {
      // Update order indices
      const updates = orderedIds.map((sectionId: string, index: number) => 
        supabase
          .from('sections')
          .update({ order_index: index })
          .eq('id', sectionId)
      );

      const results = await Promise.all(updates);
      
      const hasError = results.some(r => r.error);
      if (hasError) {
        console.error('Error reordering sections');
        return new Response(
          JSON.stringify({ error: 'Failed to reorder sections' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Sections reordered');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Admin sections error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
