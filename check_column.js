import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyupyuyiilwfewzusoix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXB5dXlpaWx3ZmV3enVzb2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTQwMTEsImV4cCI6MjA4NTkzMDAxMX0.xhGMBKARaZuiXkCgQfLDk5Tr2dw71rZ8PoFVftLCFtk';

async function checkColumn() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for social_links column...');

    // Try to select the column specifically
    const { data, error } = await supabase
        .from('admin_settings')
        .select('social_links')
        .limit(1);

    if (error) {
        console.log('Error selecting column:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('CONFIRMED: Column does not exist.');
        }
    } else {
        console.log('Column exists! Data:', data);
    }
}

checkColumn();
