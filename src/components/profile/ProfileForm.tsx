import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateProfileWithRetry } from '../../lib/api';
import { Button } from '../ui/Button';
import { ErrorDetails } from '../error/ErrorDetails';

interface ProfileFormProps {
  initialData?: {
    full_name?: string;
    bio?: string;
    phone?: string;
    photo_url?: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<{ message: string; context?: any } | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Authentication failed: ${authError.message}`);
      if (!user) throw new Error('Not authenticated');

      const formData = new FormData(e.currentTarget);
      const updates = {
        full_name: formData.get('full_name'),
        bio: formData.get('bio'),
        phone: formData.get('phone'),
        updated_at: new Date().toISOString(),
      };

      await updateProfileWithRetry(user.id, updates);

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to update profile',
        context: {
          operation: 'Profile Update',
          timestamp: new Date(),
          endpoint: '/profiles'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (!initialData) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>Error: Profile data not available</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <ErrorDetails error={new Error(error.message)} context={error.context} />
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-md">
          Profile updated successfully! Redirecting...
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={initialData?.full_name}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={initialData?.bio}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialData?.phone}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}