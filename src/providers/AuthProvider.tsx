import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { errorMonitor } from '../lib/monitoring';
import { Toast } from '../components/ui/Toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ValidRole = 'client' | 'provider';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [toast, setToast] = useState<{ type: 'error'; message: string } | null>(null);

  const ensureValidRole = async (currentUser: User): Promise<User> => {
    const currentRole = currentUser.user_metadata?.role;
    
    // Check if role is valid
    if (!currentRole || !['client', 'provider'].includes(currentRole)) {
      try {
        // Set default role as client
        const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
          data: { role: 'client' }
        });

        if (updateError) throw updateError;
        
        return updatedUser || currentUser;
      } catch (err) {
        await errorMonitor.logError({
          operation: 'auth.ensureValidRole',
          error: err instanceof Error ? err.message : 'Failed to update user role',
          severity: 'high',
          timestamp: new Date().toISOString(),
          context: { userId: currentUser.id, currentRole }
        });
        return currentUser;
      }
    }

    return currentUser;
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted && initialSession?.user) {
          const updatedUser = await ensureValidRole(initialSession.user);
          initialSession.user = updatedUser;
          
          setSession(initialSession);
          setUser(updatedUser);

          // Handle initial redirect if needed
          handleAuthRedirect(updatedUser);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (mounted && session?.user) {
            const updatedUser = await ensureValidRole(session.user);
            session.user = updatedUser;

            setSession(session);
            setUser(updatedUser);

            // Log auth event
            await errorMonitor.logSuccess({
              operation: 'auth.stateChange',
              attempts: 1,
              duration: 0,
              context: { event, role: updatedUser.user_metadata?.role }
            });

            // Handle auth state changes
            if (event === 'SIGNED_IN') {
              handleAuthRedirect(updatedUser);
            } else if (event === 'SIGNED_OUT') {
              navigate('/sign-in', { replace: true });
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error('Authentication failed');
          setError(error);
          setToast({
            type: 'error',
            message: 'Failed to initialize authentication. Please refresh the page.'
          });
          
          await errorMonitor.logError({
            operation: 'auth.initialization',
            error: error.message,
            severity: 'high',
            timestamp: new Date().toISOString()
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleAuthRedirect = (user: User) => {
    const userRole = user.user_metadata?.role as ValidRole;
    if (!userRole || !['client', 'provider'].includes(userRole)) {
      // If role is still invalid, default to client dashboard
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Get redirect path from location state or default to dashboard
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    const dashboardPath = userRole === 'provider' ? '/provider/dashboard' : '/dashboard';
    
    // Navigate to the appropriate path
    navigate(from === '/dashboard' ? dashboardPath : from, { replace: true });
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      navigate('/sign-in', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(new Error(message));
      setToast({
        type: 'error',
        message: 'Failed to sign out. Please try again.'
      });
      
      await errorMonitor.logError({
        operation: 'auth.signOut',
        error: message,
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      error,
      signOut
    }}>
      {children}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}