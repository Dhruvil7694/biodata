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

    const { action, password, currentPassword, newPassword, bootstrapToken } = await req.json();

    console.log(`Admin auth action: ${action}`);

    // ===== ACTION: setup-password (First-time initialization) =====
    if (action === 'setup-password') {
      // @ts-ignore: Deno runtime
      const expectedToken = Deno.env.get('ADMIN_BOOTSTRAP_TOKEN');

      if (!expectedToken) {
        console.error('ADMIN_BOOTSTRAP_TOKEN not configured');
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Server not configured for bootstrap'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Verify bootstrap token (must match exactly)
      if (bootstrapToken !== expectedToken) {
        console.warn(`Invalid bootstrap token attempt`);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid bootstrap token'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      // Check if credentials already exist (one-time use)
      const { data: existing, error: checkError } = await supabase
        .from('admin_credentials')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('Error checking existing credentials:', checkError);
        return new Response(
          JSON.stringify({ success: false, message: 'Server error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (existing && existing.length > 0) {
        console.warn('Bootstrap attempted but credentials already exist');
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Admin credentials already configured'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }

      // Hash the new password
      let passwordHash;
      try {
        passwordHash = await bcrypt.hash(password, 10);
      } catch (hashErr) {
        console.error('Failed to hash password:', hashErr);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to hash password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Insert into admin_credentials
      const { error: insertError } = await supabase
        .from('admin_credentials')
        .insert([{ password_hash: passwordHash }]);

      if (insertError) {
        console.error('Error creating admin credentials:', insertError);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to create credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Admin credentials initialized successfully');

      return new Response(
        JSON.stringify({ success: true, message: 'Admin account initialized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== ACTION: login =====
    if (action === 'login') {
      // Fetch admin credentials
      const { data: credentials, error: fetchError } = await supabase
        .from('admin_credentials')
        .select('id, password_hash')
        .single();

      if (fetchError) {
        console.error('Error fetching admin credentials:', fetchError);
        // Don't reveal whether table/row exists
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      if (!credentials || !credentials.password_hash) {
        console.error('No admin credentials found or password hash is empty');
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Admin account not configured'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Verify password using bcrypt (no plaintext fallback)
      let isValid = false;
      try {
        isValid = await bcrypt.compare(password, credentials.password_hash);
      } catch (e) {
        console.error('Bcrypt compare error:', e);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      if (!isValid) {
        console.warn('Login attempt failed: password mismatch');
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      console.log('Login successful');

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== ACTION: change-password =====
    if (action === 'change-password') {
      // Fetch current admin credentials
      const { data: credentials, error: fetchError } = await supabase
        .from('admin_credentials')
        .select('id, password_hash')
        .single();

      if (fetchError) {
        console.error('Error fetching admin credentials:', fetchError);
        return new Response(
          JSON.stringify({ success: false, message: 'Server error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Verify current password
      let isValid = false;
      try {
        isValid = await bcrypt.compare(currentPassword, credentials.password_hash);
      } catch (e) {
        console.error('Bcrypt compare error:', e);
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid current password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, message: 'Current password is incorrect' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Hash new password
      let newHash;
      try {
        newHash = await bcrypt.hash(newPassword, 10);
      } catch (e) {
        console.error('Failed to hash new password:', e);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to update password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Update password
      const { error: updateError } = await supabase
        .from('admin_credentials')
        .update({ password_hash: newHash })
        .eq('id', credentials.id);

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

    // ===== ACTION: health =====
    if (action === 'health') {
      const { data, error } = await supabase
        .from('admin_credentials')
        .select('id, created_at')
        .single();

      return new Response(
        JSON.stringify({
          success: !error,
          message: error ? `No admin credentials found` : 'Edge function is healthy',
          debug: {
            hasCredentials: !!data,
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
