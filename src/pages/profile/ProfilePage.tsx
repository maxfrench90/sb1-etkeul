import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchProfileWithRetry } from '../../lib/api';
import { ProfileForm } from '../../components/profile/ProfileForm';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { ErrorDetails } from '../../components/error/ErrorDetails';

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; context?: any } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw new Error(`Authentication failed: ${authError.message}`);
        }
        
        if (!user) {
          navigate('/sign-in');
          return;
        }

        const data = await fetchProfileWithRetry(user.id);

        if (mounted) {
          setProfile(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError({
            message: err instanceof Error ? err.message : 'Failed to load profile',
            context: {
              operation: 'Profile Load',
              timestamp: new Date(),
              endpoint: '/profiles'
            }
          });
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Loading Profile</h2>
          <div className="w-full max-w-md mb-6">
            <ErrorDetails error={new Error(error.message)} context={error.context} />
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
        <ProfileForm initialData={profile} />
      </div>
    </DashboardLayout>
  );
}