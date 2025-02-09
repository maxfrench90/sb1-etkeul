import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Lazy load pages
const HomePage = React.lazy(() => import('../pages/home/HomePage'));
const SignInPage = React.lazy(() => import('../pages/auth/SignInPage'));
const SignUpPage = React.lazy(() => import('../pages/auth/SignUpPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/auth/ResetPasswordPage'));
const ProfilePage = React.lazy(() => import('../pages/profile/ProfilePage'));
const ClientDashboard = React.lazy(() => import('../pages/dashboard/ClientDashboard'));
const ProviderDashboard = React.lazy(() => import('../pages/dashboard/ProviderDashboard'));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected routes */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="client">
          <ClientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/provider/dashboard" element={
        <ProtectedRoute requiredRole="provider">
          <ProviderDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

// Export both default and named export for consistency
export default AppRoutes;