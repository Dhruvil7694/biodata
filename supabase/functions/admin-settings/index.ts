// @ts-ignore: Deno imports
import { serve } from "http/server.ts";
// @ts-ignore: Deno imports
import { createClient } from "supabase-js";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const allowedUpdateFields = new Set([
    'site_title',
    'hero_image_url',
    'hero_image_urls',
    'hero_image_position',
    'is_privacy_mode',
    'social_links',
]);

function sanitizeSettingsUpdates(updates: Record<string, unknown>) {
    return Object.fromEntries(
        Object.entries(updates || {}).filter(([key]) => allowedUpdateFields.has(key))
    );
}

serve(async (req: Request) => {
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

        const { action, updates, id } = await req.json();

        if (action === 'update') {
            const safeUpdates = sanitizeSettingsUpdates(updates);

            if (!id) {
                return new Response(
                    JSON.stringify({ error: 'Missing site settings id' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                );
            }

            if (Object.keys(safeUpdates).length === 0) {
                return new Response(
                    JSON.stringify({ error: 'No supported settings fields provided' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                );
            }

            const { data, error } = await supabase
                .from('site_settings')
                .update(safeUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating site settings:', error);

                const message = error.code === '42703'
                    ? 'Database schema is missing a required site_settings column. Run the latest Supabase migration, then redeploy this function.'
                    : error.message;

                return new Response(
                    JSON.stringify({ error: message, code: error.code }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                );
            }

            return new Response(
                JSON.stringify({ data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
