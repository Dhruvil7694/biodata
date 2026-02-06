// Test script to verify Edge Function deployment and health
// Run with: node test-edge-function.js

const SUPABASE_URL = 'https://gyupyuyiilwfewzusoix.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXB5dXlpaWx3ZmV3enVzb2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTQwMTEsImV4cCI6MjA4NTkzMDAxMX0.xhGMBKARaZuiXkCgQfLDk5Tr2dw71rZ8PoFVftLCFtk';

async function testEdgeFunction(functionName, body) {
  console.log(`\n🧪 Testing ${functionName}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Edge Function Tests\n');
  console.log('=' .repeat(60));

  // Test 1: Health check
  const health = await testEdgeFunction('admin-auth', { action: 'health' });
  
  if (!health.success) {
    console.log('\n❌ CRITICAL: Edge Function is not deployed or not responding!');
    console.log('\n📋 To fix, run:');
    console.log('   npx supabase login');
    console.log('   npx supabase link --project-ref gyupyuyiilwfewzusoix');
    console.log('   npx supabase functions deploy admin-auth');
    return;
  }

  // Test 2: Login with default password
  console.log('\n' + '='.repeat(60));
  const login = await testEdgeFunction('admin-auth', { 
    action: 'login', 
    password: 'admin123' 
  });

  if (login.success && login.data.success) {
    console.log('\n✅ SUCCESS: Login works with default password!');
  } else if (login.success && !login.data.success) {
    console.log('\n⚠️  WARNING: Edge Function works but login failed');
    console.log('   This could mean:');
    console.log('   - Password hash is invalid');
    console.log('   - admin_settings table is empty');
    console.log('   - Password has been changed from default');
  }

  // Test 3: Login with wrong password
  console.log('\n' + '='.repeat(60));
  const wrongLogin = await testEdgeFunction('admin-auth', { 
    action: 'login', 
    password: 'wrongpassword' 
  });

  if (wrongLogin.success && !wrongLogin.data.success) {
    console.log('\n✅ SUCCESS: Wrong password correctly rejected');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Health Check: ${health.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Login Test: ${login.success && login.data.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Security Test: ${wrongLogin.success && !wrongLogin.data.success ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
