// @ts-ignore: Deno imports
import { serve } from "http/server.ts";
// @ts-ignore: Deno imports
import { createClient } from "supabase-js";
// @ts-ignore: Deno imports
import * as bcrypt from "npm:bcryptjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // @ts-ignore: Deno runtime
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-ignore: Deno runtime
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, password, currentPassword, newPassword } = await req.json();

    console.log(`Admin auth action: ${action}`);

    if (action === 'login') {
      // Get admin settings
      const { data: settings, error: fetchError } = await supabase
        .from('admin_settings')
        .select('password_hash')
        .single();

      if (fetchError) {
        console.error('Error fetching admin settings:', fetchError);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to read admin settings. Check that the admin_settings table exists and has data.',
            debug: { code: fetchError.code, hint: fetchError.hint }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (!settings || !settings.password_hash) {
        console.error('No admin settings or password hash found');
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Admin account not configured. Run the setup migration.',
            debug: { hasSettings: !!settings, hasHash: !!settings?.password_hash }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // DEBUG LOGGING
      console.log('Login Attempt Debug:');
      console.log(`- Password length: ${password?.length}`);
      console.log(`- Hash length: ${settings.password_hash?.length}`);

      // Verify password using bcrypt
      let isValid = false;
      try {
        console.log(`- Comparing with bcryptjs...`);
        isValid = await bcrypt.compare(password, settings.password_hash);
        console.log(`- Compare result: ${isValid}`);
      } catch (e) {
        console.error('Bcrypt compare error:', e);
      }

      // Fallback: Check for plaintext if bcrypt failed
      if (!isValid && settings.password_hash === password) {
        console.warn('Password matched as plaintext — upgrading to hash');
        isValid = true;

        // Auto-fix: hash the password and store it properly
        try {
          const properHash = await bcrypt.hash(password, 10);
          const { error: updateError } = await supabase
            .from('admin_settings')
            .update({ password_hash: properHash })
            .eq('password_hash', settings.password_hash);

          if (updateError) {
            console.error('Failed to update hash:', updateError);
          } else {
            console.log('Auto-fixed: password hash has been regenerated and saved');
          }
        } catch (hashErr) {
          console.error('Failed to auto-fix password hash:', hashErr);
        }
      }

      console.log(`Login attempt - valid: ${isValid}`);

      return new Response(
        JSON.stringify({ success: isValid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'change-password') {
      // Get current admin settings
      const { data: settings, error: fetchError } = await supabase
        .from('admin_settings')
        .select('id, password_hash')
        .single();

      if (fetchError) {
        console.error('Error fetching admin settings:', fetchError);
        return new Response(
          JSON.stringify({ success: false, message: 'Server error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Verify current password
      let isValid = false;
      try {
        isValid = await bcrypt.compare(currentPassword, settings.password_hash);
      } catch (e) {
        console.error('Bcrypt compare failed for password change:', e);
        isValid = currentPassword === settings.password_hash;
      }

      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, message: 'Current password is incorrect' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash new password and update
      const newHash = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await supabase
        .from('admin_settings')
        .update({ password_hash: newHash })
        .eq('id', settings.id);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to update password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Password changed successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Health check action for debugging
    if (action === 'health') {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('id, created_at')
        .single();

      return new Response(
        JSON.stringify({
          success: !error,
          message: error ? `Health check failed: ${error.message}` : 'Edge function is healthy',
          debug: {
            hasAdminSettings: !!data,
            supabaseUrlConfigured: !!supabaseUrl,
            serviceKeyConfigured: !!supabaseServiceKey,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: any) {
    console.error('Admin auth error:', error);
    return new Response(
      JSON.stringify({ success: false, message: `Server error: ${error.message || 'Unknown error'}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
