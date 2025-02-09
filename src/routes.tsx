import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy load pages
const HomePage = React.lazy(() => import('./pages/home/HomePage'));
const SignInPage = React.lazy(() => import('./pages/auth/SignInPage'));
const SignUpPage = React.lazy(() => import('./pages/auth/SignUpPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const ClientDashboard = React.lazy(() => import('./pages/dashboard/ClientDashboard'));
const ProviderDashboard = React.lazy(() => import('./pages/dashboard/ProviderDashboard'));
const BookingsPage = React.lazy(() => import('./pages/bookings/BookingsPage'));
const MessagesPage = React.lazy(() => import('./pages/messages/MessagesPage'));
const DocumentsPage = React.lazy(() => import('./pages/documents/DocumentsPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));

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
      <Route path="/bookings" element={
        <ProtectedRoute>
          <BookingsPage />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute>
          <DocumentsPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default AppRoutes;