// Diagnostic script to check Edge Function connectivity
// Run with: node diagnose-edge-function.js

const SUPABASE_URL = 'https://gyupyuyiilwfewzusoix.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXB5dXlpaWx3ZmV3enVzb2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTQwMTEsImV4cCI6MjA4NTkzMDAxMX0.xhGMBKARaZuiXkCgQfLDk5Tr2dw71rZ8PoFVftLCFtk';

async function diagnose() {
  console.log('\n🔍 Edge Function Diagnostics\n');
  console.log('='.repeat(60));

  // Test 1: Can client read admin_settings directly?
  console.log('\n📊 Test 1: Client-side database query');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/admin_settings?select=*`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    });

    const data = await response.json();
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`   ✅ Client can read admin_settings`);
      console.log(`   Rows returned: ${Array.isArray(data) ? data.length : 'N/A'}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   Password hash length: ${data[0].password_hash?.length || 'N/A'}`);
      }
    } else {
      console.log(`   ❌ Client cannot read admin_settings`);
      console.log(`   Error:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }

  // Test 2: Edge Function health check
  console.log('\n📊 Test 2: Edge Function health check');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({ action: 'health' }),
    });

    const data = await response.json();
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`   ✅ Edge Function is healthy`);
    } else {
      console.log(`   ❌ Edge Function reports issues`);
      if (data.debug) {
        console.log(`   Debug info:`);
        console.log(`     - Has admin_settings: ${data.debug.hasAdminSettings}`);
        console.log(`     - Supabase URL configured: ${data.debug.supabaseUrlConfigured}`);
        console.log(`     - Service key configured: ${data.debug.serviceKeyConfigured}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
  }

  // Test 3: Edge Function logs suggestion
  console.log('\n📊 Test 3: Check Edge Function logs');
  console.log(`   Run this command to see detailed logs:`);
  console.log(`   npx supabase functions logs admin-auth --tail 20`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Diagnostic Summary:\n');
  console.log('If Test 1 passes but Test 2 fails:');
  console.log('  → The database is fine, but Edge Function has issues');
  console.log('  → Check Edge Function logs for details');
  console.log('  → Service role key might be missing or wrong\n');
  
  console.log('If both tests fail:');
  console.log('  → RLS policies are still blocking access');
  console.log('  → Run FIX_EDGE_FUNCTION_ISSUE.sql again\n');
  
  console.log('If Test 1 fails but Test 2 passes:');
  console.log('  → Unusual! Client RLS is too restrictive\n');

  console.log('='.repeat(60));
}

diagnose().catch(console.error);
