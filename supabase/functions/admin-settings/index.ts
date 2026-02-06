// @ts-ignore: Deno imports
import { serve } from "http/server.ts";
// @ts-ignore: Deno imports
import { createClient } from "supabase-js";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

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

        const { action, updates, id, sql } = await req.json();

        if (action === 'update') {
            const { data, error } = await supabase
                .from('admin_settings')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return new Response(
                JSON.stringify({ data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'raw_sql') {
            // DANGEROUS: Only for emergency migration bypass. Remove after use or secure properly.
            // This uses the service role key so it has full access.
            // sql is already extracted above
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

            if (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
                );
            }

            return new Response(
                JSON.stringify({ success: true }),
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
