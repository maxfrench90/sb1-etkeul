import { supabase } from './supabase';
import { errorMonitor } from './monitoring';

// Rate limiting configuration
const RATE_LIMITS = {
  auth: { max: 5, window: 60 * 1000 }, // 5 attempts per minute
  api: { max: 100, window: 60 * 1000 }, // 100 requests per minute
  search: { max: 30, window: 60 * 1000 } // 30 searches per minute
};

// Rate limiting implementation
class RateLimiter {
  private attempts = new Map<string, Array<number>>();

  isRateLimited(key: string, type: keyof typeof RATE_LIMITS): boolean {
    const { max, window } = RATE_LIMITS[type];
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Clean up old attempts
    const recentAttempts = attempts.filter(time => now - time < window);
    this.attempts.set(key, recentAttempts);

    return recentAttempts.length >= max;
  }

  addAttempt(key: string, type: keyof typeof RATE_LIMITS) {
    const attempts = this.attempts.get(key) || [];
    attempts.push(Date.now());
    this.attempts.set(key, attempts);
  }
}

export const rateLimiter = new RateLimiter();

// Input validation
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}

// CSRF protection token
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

// Security headers
export const securityHeaders = {
  'Content-Security-Policy': 
    "default-src 'self' https://*.supabase.co; " +
    "img-src 'self' https: data:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' 'unsafe-eval' https://*.stripe.com; " +
    "frame-src https://*.stripe.com;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Password validation
export function validatePassword(password: string): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Session security
export async function validateSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (!session) return false;

    // Check if token is about to expire (within 5 minutes)
    const expiresAt = new Date(session.expires_at!).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt - now < fiveMinutes) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
    }

    return true;
  } catch (error) {
    await errorMonitor.logError({
      operation: 'security.validateSession',
      error: error instanceof Error ? error.message : 'Session validation failed',
      severity: 'high',
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

// API request validation
export function validateRequest(req: Request): boolean {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return false;

  const csrfToken = req.headers.get('X-CSRF-Token');
  if (!csrfToken) return false;

  // Additional validations as needed
  return true;
}

// Security event logging
export async function logSecurityEvent(event: {
  type: string;
  severity: 'low' | 'medium' | 'high';
  details: any;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('security_logs')
      .insert({
        user_id: user?.id,
        event_type: event.type,
        severity: event.severity,
        details: event.details,
        ip_address: window.clientInformation?.userAgent,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    await errorMonitor.logError({
      operation: 'security.logEvent',
      error: error instanceof Error ? error.message : 'Failed to log security event',
      severity: 'high',
      timestamp: new Date().toISOString(),
      context: event
    });
  }
}