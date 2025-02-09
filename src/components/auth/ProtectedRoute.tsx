import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { errorMonitor } from '../../lib/monitoring';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'provider';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (!loading && !user) {
      errorMonitor.logError({
        operation: 'route_protection',
        error: 'Unauthorized access attempt',
        severity: 'low',
        timestamp: new Date().toISOString(),
        context: {
          path: location.pathname,
          requiredRole
        }
      });
    }
  }, [loading, user, location.pathname, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for post-login redirect
    return (
      <Navigate 
        to="/sign-in" 
        state={{ from: location }}
        replace 
      />
    );
  }

  // Get user role from metadata, defaulting to 'client' if not set
  const userRole = user.user_metadata?.role || 'client';

  // Check if user has required role
  if (requiredRole && userRole !== requiredRole) {
    errorMonitor.logError({
      operation: 'role_verification',
      error: 'Invalid role access attempt',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context: {
        userRole,
        requiredRole,
        path: location.pathname,
        userId: user.id
      }
    });

    // Redirect to appropriate dashboard based on actual role
    const correctPath = userRole === 'provider' ? '/provider/dashboard' : '/dashboard';
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}