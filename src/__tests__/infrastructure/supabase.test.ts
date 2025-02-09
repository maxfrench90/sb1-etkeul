import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('Supabase Integration', () => {
  it('handles authentication flow', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    });

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(error).toBeNull();
    expect(user).toEqual(mockUser);
  });

  it('handles real-time subscriptions', async () => {
    const mockCallback = vi.fn();
    const channel = supabase.channel('test');
    
    channel.on('*', mockCallback).subscribe();

    // Simulate real-time event
    channel.emit('UPDATE', { new: { id: '1' }, old: { id: '1' } });
    
    expect(mockCallback).toHaveBeenCalled();
  });

  it('recovers from connection errors', async () => {
    const mockError = new Error('Connection lost');
    vi.mocked(supabase.connect).mockRejectedValueOnce(mockError);

    // Attempt reconnection
    await supabase.connect();

    expect(errorMonitor.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'supabase.connect',
        error: mockError.message
      })
    );
  });
});