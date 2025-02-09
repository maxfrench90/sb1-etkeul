import { supabase } from './supabase';
import { errorMonitor } from './monitoring';

interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
  operation?: string;
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high';
}

// Operation-specific retry configurations with severity levels
const RETRY_POLICIES = {
  profile: {
    maxAttempts: 3,
    delayMs: 1000,
    backoff: true,
    severity: 'medium' as const
  },
  booking: {
    maxAttempts: 5,
    delayMs: 500,
    backoff: true,
    severity: 'high' as const
  },
  payment: {
    maxAttempts: 2,
    delayMs: 2000,
    backoff: true,
    severity: 'high' as const
  },
  notification: {
    maxAttempts: 3,
    delayMs: 500,
    backoff: false,
    severity: 'low' as const
  },
  search: {
    maxAttempts: 2,
    delayMs: 500,
    backoff: true,
    severity: 'low' as const
  }
} as const;

// Exponential backoff calculation
function calculateBackoff(baseDelay: number, attempt: number, maxDelay: number = 30000): number {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay);
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const operationType = config.operation?.split('.')[0] as keyof typeof RETRY_POLICIES;
  const policy = operationType ? RETRY_POLICIES[operationType] : {};
  
  const {
    maxAttempts = policy.maxAttempts ?? 3,
    delayMs = policy.delayMs ?? 1000,
    backoff = policy.backoff ?? true,
    operation: operationName = 'unknown',
    context = {},
    severity = policy.severity ?? 'medium'
  } = config;

  let lastError: Error;
  let startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // Log successful retry if it wasn't the first attempt
      if (attempt > 1) {
        await errorMonitor.logSuccess({
          operation: operationName,
          attempts: attempt,
          duration: Date.now() - startTime,
          context
        });
      }
      
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Operation failed');
      const duration = Date.now() - startTime;
      
      await errorMonitor.logError({
        operation: operationName,
        error: lastError.message,
        context: {
          ...context,
          attempt,
          maxAttempts,
          duration
        },
        timestamp: new Date().toISOString(),
        retryCount: attempt - 1,
        userId: (await supabase.auth.getUser()).data.user?.id,
        severity
      });
      
      if (attempt === maxAttempts) break;
      
      const delay = backoff ? calculateBackoff(delayMs, attempt) : delayMs;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Operation-specific retry functions with proper typing
interface ProfileData {
  id: string;
  email: string;
  full_name?: string;
  role: 'provider' | 'client';
  bio?: string;
  photo_url?: string;
  phone?: string;
}

export async function fetchProfileWithRetry(userId: string): Promise<ProfileData> {
  return retryOperation(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      return data as ProfileData;
    },
    {
      operation: 'profile.fetch',
      context: { userId }
    }
  );
}

interface ProfileUpdates extends Partial<Omit<ProfileData, 'id' | 'email'>> {
  updated_at?: string;
}

export async function updateProfileWithRetry(userId: string, updates: ProfileUpdates) {
  return retryOperation(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return data;
    },
    {
      operation: 'profile.update',
      context: { userId, updates }
    }
  );
}