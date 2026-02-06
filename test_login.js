import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gyupyuyiilwfewzusoix.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXB5dXlpaWx3ZmV3enVzb2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTQwMTEsImV4cCI6MjA4NTkzMDAxMX0.xhGMBKARaZuiXkCgQfLDk5Tr2dw71rZ8PoFVftLCFtk';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testLogin() {
    console.log('Testing login with "admin123"...');
    const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'login', password: 'admin123' }
    });

    if (error) {
        console.error('Function error:', error);
    } else {
        console.log('Response:', data);
    }
}

testLogin();
