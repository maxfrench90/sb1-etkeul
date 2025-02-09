import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { useAuth } from '../../providers/AuthProvider';

function MessagesPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <ChatWindow
          participantId={user.id}
          participantName={user.user_metadata?.full_name || 'User'}
          participantAvatar={user.user_metadata?.avatar_url}
        />
      </div>
    </DashboardLayout>
  );
}

export default MessagesPage;