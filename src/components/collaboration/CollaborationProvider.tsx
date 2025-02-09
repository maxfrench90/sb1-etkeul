import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { errorMonitor } from '../../lib/monitoring';
import { metricsCollector } from '../../lib/monitoring';

interface Presence {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastActive: string;
  status: 'online' | 'away' | 'offline';
  currentView?: string;
}

interface CollaborationContextType {
  activeUsers: Presence[];
  userStatus: Presence['status'];
  setUserStatus: (status: Presence['status']) => void;
  setCurrentView: (view: string) => void;
  isOnline: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<Presence[]>([]);
  const [userStatus, setUserStatus] = useState<Presence['status']>('online');
  const [isOnline, setIsOnline] = useState(true);
  const channelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const retryAttemptsRef = useRef(0);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setupPresence();
    };

    const handleOffline = () => {
      setIsOnline(false);
      cleanup();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cleanup = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const setupPresence = async () => {
    if (!user?.id || !isOnline) return;

    try {
      cleanup();

      // Create new channel
      channelRef.current = supabase.channel('presence')
        .on('presence', { event: 'sync' }, () => {
          const state = channelRef.current?.presenceState<Presence>();
          if (state) {
            const validUsers = Object.values(state).filter(presence => 
              presence?.user?.id && presence?.lastActive && presence?.status
            );
            setActiveUsers(validUsers);
          }
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          if (Array.isArray(newPresences)) {
            setActiveUsers(prev => {
              const newUsers = [...prev];
              newPresences.forEach(presence => {
                if (presence?.user?.id && !newUsers.some(u => u.user.id === presence.user.id)) {
                  newUsers.push(presence);
                }
              });
              return newUsers;
            });
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          if (Array.isArray(leftPresences)) {
            setActiveUsers(prev => 
              prev.filter(p => !leftPresences.some(lp => lp?.user?.id === p.user.id))
            );
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await trackPresence();
            retryAttemptsRef.current = 0;

            // Log successful connection
            metricsCollector.recordEvent({
              type: 'realtime_event',
              subtype: 'connection',
              success: true,
              metadata: { userId: user.id }
            });
          } else if (status === 'CLOSED' && isOnline) {
            // Handle reconnection with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, retryAttemptsRef.current), 30000);
            reconnectTimeoutRef.current = setTimeout(setupPresence, delay);
            retryAttemptsRef.current++;

            // Log reconnection attempt
            metricsCollector.recordEvent({
              type: 'realtime_event',
              subtype: 'reconnection',
              success: false,
              metadata: {
                userId: user.id,
                attempt: retryAttemptsRef.current,
                delay
              }
            });
          }
        });

      // Set up heartbeat
      heartbeatIntervalRef.current = setInterval(trackPresence, 30000);

      // Log successful setup
      await errorMonitor.logSuccess({
        operation: 'presence.setup',
        attempts: retryAttemptsRef.current + 1,
        duration: 0,
        context: { userId: user.id }
      });
    } catch (err) {
      // Log setup error
      await errorMonitor.logError({
        operation: 'presence.setup',
        error: err instanceof Error ? err.message : 'Failed to setup presence',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { 
          userId: user.id,
          retryAttempt: retryAttemptsRef.current
        }
      });

      // Retry setup
      if (isOnline) {
        const delay = Math.min(1000 * Math.pow(2, retryAttemptsRef.current), 30000);
        reconnectTimeoutRef.current = setTimeout(setupPresence, delay);
        retryAttemptsRef.current++;
      }
    }
  };

  const trackPresence = async () => {
    if (!user?.id || !channelRef.current) return;

    try {
      await channelRef.current.track({
        user: {
          id: user.id,
          name: user.user_metadata?.full_name || 'Anonymous',
          avatar: user.user_metadata?.avatar_url
        },
        lastActive: new Date().toISOString(),
        status: userStatus
      });
    } catch (err) {
      console.error('Failed to track presence:', err);
    }
  };

  // Set up presence when user or online status changes
  useEffect(() => {
    setupPresence();
    return cleanup;
  }, [user?.id, isOnline]);

  const setCurrentView = async (view: string) => {
    if (!user?.id || !channelRef.current) return;

    try {
      await channelRef.current.track({
        user: {
          id: user.id,
          name: user.user_metadata?.full_name || 'Anonymous',
          avatar: user.user_metadata?.avatar_url
        },
        lastActive: new Date().toISOString(),
        status: userStatus,
        currentView: view
      });
    } catch (err) {
      await errorMonitor.logError({
        operation: 'presence.updateView',
        error: err instanceof Error ? err.message : 'Failed to update view',
        severity: 'low',
        timestamp: new Date().toISOString(),
        context: { userId: user.id, view }
      });
    }
  };

  return (
    <CollaborationContext.Provider
      value={{
        activeUsers,
        userStatus,
        setUserStatus,
        setCurrentView,
        isOnline
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}