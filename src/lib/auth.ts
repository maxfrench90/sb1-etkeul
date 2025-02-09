import { supabase } from './supabase';
import { errorMonitor } from './monitoring';

interface SignInOptions {
  email: string;
  password: string;
  redirectTo?: string;
}

interface SignUpOptions extends SignInOptions {
  metadata?: {
    role?: 'client' | 'provider';
    full_name?: string;
  };
}

export async function signInWithEmail({ email, password, redirectTo }: SignInOptions) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
      options: {
        redirectTo
      }
    });
    
    if (error) {
      // Log auth error for monitoring
      await errorMonitor.logError({
        operation: 'auth.signIn',
        error: error.message,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { email }
      });
      throw error;
    }

    // Log successful sign in
    await errorMonitor.logSuccess({
      operation: 'auth.signIn',
      attempts: 1,
      duration: 0,
      context: { email }
    });

    return data;
  } catch (error) {
    throw error;
  }
}

export async function signUpWithEmail({ 
  email, 
  password, 
  metadata,
  redirectTo 
}: SignUpOptions) {
  try {
    // Validate email format
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          role: metadata?.role || 'client',
          full_name: metadata?.full_name
        },
        emailRedirectTo: redirectTo
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists');
      }
      throw error;
    }

    // Log successful sign up
    await errorMonitor.logSuccess({
      operation: 'auth.signUp',
      attempts: 1,
      duration: 0,
      context: { email, role: metadata?.role }
    });

    return data;
  } catch (error) {
    // Log sign up error
    await errorMonitor.logError({
      operation: 'auth.signUp',
      error: error instanceof Error ? error.message : 'Sign up failed',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context: { email, role: metadata?.role }
    });
    throw error;
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`
      }
    );
    
    if (error) throw error;

    // Log successful password reset request
    await errorMonitor.logSuccess({
      operation: 'auth.resetPassword',
      attempts: 1,
      duration: 0,
      context: { email }
    });
  } catch (error) {
    // Log password reset error
    await errorMonitor.logError({
      operation: 'auth.resetPassword',
      error: error instanceof Error ? error.message : 'Password reset failed',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context: { email }
    });
    throw error;
  }
}

export async function updatePassword(newPassword: string) {
  try {
    // Validate password strength
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;

    // Log successful password update
    await errorMonitor.logSuccess({
      operation: 'auth.updatePassword',
      attempts: 1,
      duration: 0
    });
  } catch (error) {
    // Log password update error
    await errorMonitor.logError({
      operation: 'auth.updatePassword',
      error: error instanceof Error ? error.message : 'Password update failed',
      severity: 'medium',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!session || error) {
      throw error || new Error('No active session');
    }

    const { data, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) throw refreshError;
    
    return data.session;
  } catch (error) {
    // Log session refresh error
    await errorMonitor.logError({
      operation: 'auth.refreshSession',
      error: error instanceof Error ? error.message : 'Session refresh failed',
      severity: 'high',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}