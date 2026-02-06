import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { checkSupabaseHealth } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';

export function DiagnosticPanel() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const health = await checkSupabaseHealth();
      
      // Additional tests
      const envCheck = {
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        url: import.meta.env.VITE_SUPABASE_URL,
      };

      // Test Edge Function directly
      let edgeFunctionTest = null;
      try {
        const { data, error } = await supabase.functions.invoke('admin-auth', {
          body: { action: 'health' }
        });
        edgeFunctionTest = { success: !error, data, error: error?.message };
      } catch (err) {
        edgeFunctionTest = { success: false, error: String(err) };
      }

      setResults({
        health,
        envCheck,
        edgeFunctionTest,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => status ? '✅' : '❌';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔍 System Diagnostics</CardTitle>
        <CardDescription>
          Check Supabase connection, database, and Edge Functions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? 'Running Tests...' : 'Run Diagnostics'}
        </Button>

        {results && (
          <div className="space-y-4 font-mono text-sm">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-bold mb-2">Environment Variables</h3>
              <div className="space-y-1">
                <div>{getStatusIcon(results.envCheck?.hasUrl)} VITE_SUPABASE_URL: {results.envCheck?.hasUrl ? 'Set' : 'Missing'}</div>
                <div>{getStatusIcon(results.envCheck?.hasKey)} VITE_SUPABASE_PUBLISHABLE_KEY: {results.envCheck?.hasKey ? 'Set' : 'Missing'}</div>
                {results.envCheck?.url && (
                  <div className="text-xs text-muted-foreground mt-2">URL: {results.envCheck.url}</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-bold mb-2">Connection Status</h3>
              <div className="space-y-1">
                <div>{getStatusIcon(results.health?.connected)} Connected: {results.health?.connected ? 'Yes' : 'No'}</div>
                <div>{getStatusIcon(results.health?.database)} Database: {results.health?.database ? 'Working' : 'Failed'}</div>
                <div>{getStatusIcon(results.health?.functions)} Edge Functions: {results.health?.functions ? 'Working' : 'Failed'}</div>
              </div>
              {results.health?.error && (
                <div className="mt-2 text-red-500 text-xs">Error: {results.health.error}</div>
              )}
            </div>

            {results.health?.details && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-bold mb-2">Detailed Results</h3>
                <div className="space-y-1 text-xs">
                  <div>Database Test: {results.health.details.databaseTest}</div>
                  <div>Functions Test: {results.health.details.functionsTest}</div>
                  <div>{getStatusIcon(results.health.details.adminSettingsExists)} Admin Settings: {results.health.details.adminSettingsExists ? 'Exists' : 'Missing'}</div>
                </div>
              </div>
            )}

            {results.edgeFunctionTest && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-bold mb-2">Edge Function Direct Test</h3>
                <div className="space-y-1 text-xs">
                  <div>{getStatusIcon(results.edgeFunctionTest.success)} Status: {results.edgeFunctionTest.success ? 'Success' : 'Failed'}</div>
                  {results.edgeFunctionTest.error && (
                    <div className="text-red-500">Error: {results.edgeFunctionTest.error}</div>
                  )}
                  {results.edgeFunctionTest.data && (
                    <div className="mt-2">
                      <div className="font-semibold">Response:</div>
                      <pre className="mt-1 p-2 bg-background rounded overflow-auto">
                        {JSON.stringify(results.edgeFunctionTest.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Last run: {new Date(results.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {results && !results.health?.functions && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Edge Functions Not Working</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
              Edge Functions need to be deployed. Run these commands:
            </p>
            <pre className="text-xs bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded overflow-auto">
              npx supabase login{'\n'}
              npx supabase link --project-ref {import.meta.env.VITE_SUPABASE_PROJECT_ID}{'\n'}
              npx supabase functions deploy admin-auth
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
