import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { NotificationSettings } from '../../components/settings/NotificationSettings';

function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <NotificationSettings />
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;