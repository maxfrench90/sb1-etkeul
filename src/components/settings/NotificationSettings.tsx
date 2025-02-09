import React from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

export function NotificationSettings() {
  const [settings, setSettings] = React.useState({
    emailNotifications: true,
    bookingConfirmations: true,
    reminderEmails: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data?.notification_preferences) {
        setSettings(data.notification_preferences);
      }
    } catch (err) {
      console.error('Error loading notification settings:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: settings })
        .eq('id', user.id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Email Notifications
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="emailNotifications"
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  emailNotifications: e.target.checked
                })}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                Enable Email Notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive important updates about your account and bookings
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="bookingConfirmations"
                type="checkbox"
                checked={settings.bookingConfirmations}
                onChange={(e) => setSettings({
                  ...settings,
                  bookingConfirmations: e.target.checked
                })}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="bookingConfirmations" className="font-medium text-gray-700">
                Booking Confirmations
              </label>
              <p className="text-sm text-gray-500">
                Receive email confirmations for new bookings
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="reminderEmails"
                type="checkbox"
                checked={settings.reminderEmails}
                onChange={(e) => setSettings({
                  ...settings,
                  reminderEmails: e.target.checked
                })}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="reminderEmails" className="font-medium text-gray-700">
                Reminder Emails
              </label>
              <p className="text-sm text-gray-500">
                Receive reminders before upcoming appointments
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="marketingEmails"
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={(e) => setSettings({
                  ...settings,
                  marketingEmails: e.target.checked
                })}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="marketingEmails" className="font-medium text-gray-700">
                Marketing Emails
              </label>
              <p className="text-sm text-gray-500">
                Receive updates about new features and promotions
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </form>
  );
}