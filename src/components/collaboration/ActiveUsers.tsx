import React from 'react';
import { useCollaboration } from './CollaborationProvider';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { formatDistanceToNow } from 'date-fns';

interface ActiveUsersProps {
  maxDisplayed?: number;
  showStatus?: boolean;
  className?: string;
}

export function ActiveUsers({
  maxDisplayed = 5,
  showStatus = true,
  className = ''
}: ActiveUsersProps) {
  const { activeUsers } = useCollaboration();
  const displayedUsers = activeUsers.slice(0, maxDisplayed);
  const remainingCount = Math.max(0, activeUsers.length - maxDisplayed);

  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {displayedUsers.map((presence) => (
        <Tooltip
          key={presence.user.id}
          content={
            <div className="text-sm">
              <p className="font-medium">{presence.user.name}</p>
              {showStatus && (
                <>
                  <p className="text-xs text-gray-200">
                    {presence.status === 'online' ? 'Online' : 'Away'}
                  </p>
                  <p className="text-xs text-gray-200">
                    Active {formatDistanceToNow(new Date(presence.lastActive))} ago
                  </p>
                  {presence.currentView && (
                    <p className="text-xs text-gray-200">
                      Viewing: {presence.currentView}
                    </p>
                  )}
                </>
              )}
            </div>
          }
        >
          <div className="relative">
            <Avatar
              src={presence.user.avatar}
              alt={presence.user.name}
              size="sm"
              className="ring-2 ring-white"
            />
            {showStatus && (
              <span
                className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white ${
                  presence.status === 'online'
                    ? 'bg-green-400'
                    : presence.status === 'away'
                    ? 'bg-yellow-400'
                    : 'bg-gray-400'
                }`}
              />
            )}
          </div>
        </Tooltip>
      ))}
      {remainingCount > 0 && (
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white">
          <span className="text-xs font-medium text-gray-600">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}