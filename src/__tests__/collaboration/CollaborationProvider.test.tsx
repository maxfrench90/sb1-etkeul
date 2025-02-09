import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CollaborationProvider, useCollaboration } from '../../components/collaboration/CollaborationProvider';
import { supabase } from '../../lib/supabase';
import { metricsCollector } from '../../lib/monitoring';

// Mock Supabase channel
const mockTrack = vi.fn();
const mockSubscribe = vi.fn();
const mockChannel = {
  on: () => mockChannel,
  track: mockTrack,
  subscribe: mockSubscribe
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn()
  }
}));

describe('CollaborationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('tracks user presence correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CollaborationProvider>{children}</CollaborationProvider>
    );

    const { result } = renderHook(() => useCollaboration(), { wrapper });

    // Simulate user joining
    act(() => {
      mockSubscribe.mock.calls[0][0]('SUBSCRIBED');
    });

    expect(mockTrack).toHaveBeenCalledWith(expect.objectContaining({
      status: 'online'
    }));

    // Change user status
    act(() => {
      result.current.setUserStatus('away');
    });

    expect(mockTrack).toHaveBeenCalledWith(expect.objectContaining({
      status: 'away'
    }));
  });

  it('handles connection state changes', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CollaborationProvider>{children}</CollaborationProvider>
    );

    const { result } = renderHook(() => useCollaboration(), { wrapper });

    // Simulate going offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);

    // Simulate coming back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(metricsCollector.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'realtime_event',
        subtype: 'connection'
      })
    );
  });

  it('handles view changes correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CollaborationProvider>{children}</CollaborationProvider>
    );

    const { result } = renderHook(() => useCollaboration(), { wrapper });

    act(() => {
      result.current.setCurrentView('/dashboard');
    });

    expect(mockTrack).toHaveBeenCalledWith(expect.objectContaining({
      currentView: '/dashboard'
    }));
  });
});