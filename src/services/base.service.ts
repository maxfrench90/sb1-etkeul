import { supabase } from '../lib/supabase';
import { errorMonitor } from '../lib/monitoring';

export class BaseService {
  protected async handleError(error: unknown, operation: string, context?: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    await errorMonitor.logError({
      operation,
      error: errorMessage,
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context
    });

    throw error;
  }

  protected getClient() {
    return supabase;
  }
}