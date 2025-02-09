import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { errorMonitor } from './monitoring';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'x-application-name': 'pet-pathways'
    },
    fetch: async (url, options = {}) => {
      try {
        // Ensure headers are properly set
        const headers = new Headers(options.headers);
        headers.set('apikey', supabaseKey);
        headers.set('x-timestamp', new Date().toISOString());

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.set('Authorization', `Bearer ${session.access_token}`);
        }

        const response = await fetch(url, {
          ...options,
          headers
        });

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            // Try to refresh the session
            const { data: { session: newSession }, error: refreshError } = 
              await supabase.auth.refreshSession();
            
            if (refreshError || !newSession) {
              throw new Error('Session expired - please sign in again');
            }

            // Retry with new token
            headers.set('Authorization', `Bearer ${newSession.access_token}`);
            const retryResponse = await fetch(url, {
              ...options,
              headers
            });

            if (!retryResponse.ok) {
              throw new Error(`Request failed: ${retryResponse.statusText}`);
            }

            return retryResponse;
          }

          // Log failed requests
          await errorMonitor.logError({
            operation: 'supabase.fetch',
            error: `HTTP error! status: ${response.status}`,
            severity: 'high',
            timestamp: new Date().toISOString(),
            context: {
              url,
              method: options.method || 'GET',
              status: response.status,
              statusText: response.statusText
            }
          });

          throw new Error(`Request failed: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        await errorMonitor.logError({
          operation: 'supabase.fetch',
          error: error instanceof Error ? error.message : 'Network request failed',
          severity: 'high',
          timestamp: new Date().toISOString(),
          context: {
            url,
            method: options.method || 'GET'
          }
        });
        throw error;
      }
    }
  }
});

// Initialize connection monitoring
let connectionMonitorInterval: NodeJS.Timeout;

export function startConnectionMonitoring(intervalMs = 30000) {
  if (connectionMonitorInterval) {
    clearInterval(connectionMonitorInterval);
  }

  connectionMonitorInterval = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        await errorMonitor.logError({
          operation: 'supabase.connection',
          error: 'No active session',
          severity: 'high',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { error } = await supabase
        .from('health_check')
        .select('count')
        .single();

      if (error) {
        await errorMonitor.logError({
          operation: 'supabase.connection',
          error: error.message,
          severity: 'high',
          timestamp: new Date().toISOString()
        });

        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
        }
      }
    } catch (err) {
      console.error('Connection monitoring error:', err);
    }
  }, intervalMs);

  return () => {
    if (connectionMonitorInterval) {
      clearInterval(connectionMonitorInterval);
    }
  };
}