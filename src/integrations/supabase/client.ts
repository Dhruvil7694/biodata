import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables at startup
function validateEnvVars(): { url: string; key: string } {
  const errors: string[] = [];

  if (!SUPABASE_URL || typeof SUPABASE_URL !== 'string' || !SUPABASE_URL.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL is missing or invalid. Expected format: https://<project>.supabase.co');
  }

  if (!SUPABASE_PUBLISHABLE_KEY || typeof SUPABASE_PUBLISHABLE_KEY !== 'string' || SUPABASE_PUBLISHABLE_KEY.length < 20) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is missing or invalid.');
  }

  if (errors.length > 0) {
    const message = `[Supabase] Configuration Error:\n${errors.join('\n')}`;
    console.error(message);
    throw new Error(message);
  }

  // Log safe connection info (no secrets)
  console.info(`[Supabase] Configured for: ${SUPABASE_URL}`);
  console.info(`[Supabase] Anon key loaded: ${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...`);

  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}

const { url, key } = validateEnvVars();

export const supabase: SupabaseClient<Database> = createClient<Database>(url, key, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Health check: verify Supabase is reachable and the database responds
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  database: boolean;
  functions: boolean;
  error?: string;
  details?: {
    databaseTest?: string;
    functionsTest?: string;
    adminSettingsExists?: boolean;
  };
}> {
  const result = { 
    connected: false, 
    database: false, 
    functions: false, 
    error: undefined as string | undefined,
    details: {} as any
  };

  try {
    // Test 1: Database connectivity - query sections table
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('sections')
      .select('id')
      .limit(1);

    if (sectionsError) {
      result.error = `Database query failed: ${sectionsError.message} (code: ${sectionsError.code})`;
      result.details.databaseTest = `Failed: ${sectionsError.message}`;
      console.error(`[Supabase Health] ${result.error}`);
      result.connected = true; // Connection works but query failed (likely RLS)
      result.database = false;
    } else {
      result.connected = true;
      result.database = true;
      result.details.databaseTest = `Success: ${sectionsData?.length ?? 0} row(s)`;
      console.info(`[Supabase Health] Database connected - ${sectionsData?.length ?? 0} test row(s) returned`);
    }

    // Test 2: Check if site_settings exists (public site configuration)
    const { data: siteSettingsData, error: siteSettingsError } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1);

    result.details.adminSettingsExists = !siteSettingsError && !!siteSettingsData && siteSettingsData.length > 0;
    
    if (siteSettingsError) {
      console.warn(`[Supabase Health] site_settings check failed: ${siteSettingsError.message}`);
    } else if (!siteSettingsData || siteSettingsData.length === 0) {
      console.warn(`[Supabase Health] site_settings table is empty - run the secure baseline migration`);
    } else {
      console.info(`[Supabase Health] site_settings exists with data`);
    }

    // Test 3: Edge Functions health check
    try {
      const { data: funcData, error: funcError } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'health' }
      });

      if (funcError) {
        result.details.functionsTest = `Failed: ${funcError.message}`;
        console.error(`[Supabase Health] Edge Function test failed: ${funcError.message}`);
        result.functions = false;
      } else if (funcData?.success) {
        result.details.functionsTest = 'Success: Edge Function is healthy';
        console.info(`[Supabase Health] Edge Functions working`);
        result.functions = true;
      } else {
        result.details.functionsTest = `Unhealthy: ${funcData?.message || 'Unknown error'}`;
        console.warn(`[Supabase Health] Edge Function unhealthy: ${funcData?.message}`);
        result.functions = false;
      }
    } catch (funcErr) {
      result.details.functionsTest = `Error: ${funcErr instanceof Error ? funcErr.message : String(funcErr)}`;
      console.error(`[Supabase Health] Edge Function error:`, funcErr);
      result.functions = false;
    }

  } catch (err) {
    result.error = `Connection failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[Supabase Health] ${result.error}`);
  }

  // Log summary
  console.info(`[Supabase Health] Summary:`, {
    connected: result.connected,
    database: result.database,
    functions: result.functions,
    details: result.details
  });

  return result;
}
