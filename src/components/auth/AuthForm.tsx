import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { errorMonitor } from '../../lib/monitoring';
import { Toast } from '../ui/Toast';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional()
});

interface AuthFormProps {
  type: 'sign-in' | 'sign-up';
  role?: 'client' | 'provider';
}

export function AuthForm({ type, role = 'client' }: AuthFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const validatedData = authSchema.parse({
        email: formData.get('email'),
        password: formData.get('password'),
        ...(type === 'sign-up' && { fullName: formData.get('fullName') })
      });

      if (type === 'sign-up') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            data: {
              role: role, // Ensure role is explicitly set
              full_name: validatedData.fullName
            }
          }
        });

        if (signUpError) {
          if (signUpError.message === 'User already registered') {
            setToast({
              type: 'error',
              message: 'An account with this email already exists. Please sign in instead.'
            });
            setTimeout(() => navigate('/sign-in', { state: { email: validatedData.email } }), 2000);
            return;
          }
          throw signUpError;
        }

        setToast({
          type: 'success',
          message: 'Account created successfully'
        });

        // Redirect to appropriate dashboard based on role
        const dashboardPath = role === 'provider' ? '/provider/dashboard' : '/dashboard';
        setTimeout(() => navigate(dashboardPath, { replace: true }), 1500);
      } else {
        setAttempts(prev => prev + 1);
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password
        });

        if (signInError) throw signInError;

        // Get redirect path from location state or default to dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        const userRole = user?.user_metadata?.role || 'client'; // Default to client if no role
        const dashboardPath = userRole === 'provider' ? '/provider/dashboard' : '/dashboard';
        
        setToast({
          type: 'success',
          message: 'Sign in successful'
        });

        // Navigate to the appropriate path
        setTimeout(() => {
          navigate(from === '/dashboard' ? dashboardPath : from, { replace: true });
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      
      await errorMonitor.logError({
        operation: `auth.${type}`,
        error: errorMessage,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { attempts, role }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
          {attempts >= 2 && type === 'sign-in' && (
            <div className="mt-2">
              <a 
                href="/reset-password" 
                className="text-red-700 hover:text-red-800 underline"
              >
                Reset your password
              </a>
            </div>
          )}
        </div>
      )}

      {type === 'sign-up' && (
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Please wait...</span>
          </div>
        ) : (
          type === 'sign-up' ? 'Sign Up' : 'Sign In'
        )}
      </Button>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </form>
  );
}