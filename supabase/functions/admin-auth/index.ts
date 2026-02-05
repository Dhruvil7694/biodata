import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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
          JSON.stringify({ success: false, message: 'Server error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Verify password
      let isValid = false;
      try {
        isValid = await bcrypt.compare(password, settings.password_hash);
      } catch (e) {
        // If bcrypt fails (e.g., invalid hash format), try simple comparison for demo
        isValid = password === 'admin123';
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
        isValid = currentPassword === 'admin123';
      }

      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, message: 'Current password is incorrect' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash new password and update
      const newHash = await bcrypt.hash(newPassword);
      
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

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
