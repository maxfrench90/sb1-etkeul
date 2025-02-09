import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { errorMonitor } from '../lib/monitoring';

export function useAuthRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const handleRedirect = async () => {
      try {
        if (!user) {
          // Not authenticated, redirect to sign in
          const currentPath = location.pathname;
          if (currentPath !== '/sign-in' && currentPath !== '/sign-up') {
            navigate('/sign-in', { state: { from: location }, replace: true });
          }
          return;
        }

        // User is authenticated
        const userRole = user.user_metadata.role;
        const currentPath = location.pathname;

        // Determine correct dashboard based on role
        const correctDashboard = userRole === 'provider' ? '/provider/dashboard' : '/dashboard';

        // Handle root path redirect
        if (currentPath === '/') {
          navigate(correctDashboard, { replace: true });
          return;
        }

        // Handle role-specific paths
        if (currentPath.startsWith('/provider/') && userRole !== 'provider') {
          navigate(correctDashboard, { replace: true });
          return;
        }

        // Log successful navigation
        await errorMonitor.logSuccess({
          operation: 'navigation',
          attempts: 1,
          duration: 0,
          context: {
            path: currentPath,
            userRole,
            redirected: currentPath !== location.pathname
          }
        });
      } catch (error) {
        // Log navigation error
        await errorMonitor.logError({
          operation: 'navigation',
          error: error instanceof Error ? error.message : 'Navigation failed',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          context: {
            path: location.pathname,
            userRole: user?.user_metadata.role
          }
        });
      }
    };

    handleRedirect();
  }, [user, loading, location, navigate]);

  return { isLoading: loading };
}