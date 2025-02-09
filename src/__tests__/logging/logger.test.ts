import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../../lib/logging';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Logging', () => {
    it('buffers log entries', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await logger.info('Test message', { test: true });

      // Should not have called insert yet (buffering)
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('flushes logs when buffer is full', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Fill the buffer
      for (let i = 0; i < 51; i++) {
        await logger.info(`Message ${i}`);
      }

      expect(supabase.from).toHaveBeenCalledWith('logs');
    });

    it('handles log flush errors', async () => {
      const error = new Error('Flush failed');
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        throw error;
      });

      await logger.info('Test message');
      vi.advanceTimersByTime(30000); // Trigger flush

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'logger.flush',
          error: error.message
        })
      );
    });
  });

  describe('Audit Logging', () => {
    it('creates audit entries', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await logger.audit(
        'create',
        'booking',
        'booking-123',
        { status: 'confirmed' }
      );

      // Should track significant actions
      expect(errorMonitor.logSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'booking.create'
        })
      );
    });

    it('includes user context in audit logs', async () => {
      const mockUser = { id: 'user-123' };
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await logger.audit(
        'update',
        'profile',
        'profile-123',
        { name: 'New Name' }
      );

      vi.advanceTimersByTime(30000); // Trigger flush

      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
      expect(supabase.from).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id
        })
      );
    });
  });

  describe('Log Levels', () => {
    it('handles different log levels', async () => {
      await logger.debug('Debug message');
      await logger.info('Info message');
      await logger.warn('Warning message');
      await logger.error('Error message');

      vi.advanceTimersByTime(30000); // Trigger flush

      const insertCalls = vi.mocked(supabase.from).mock.calls;
      expect(insertCalls).toHaveLength(1); // One batch insert
      
      const logEntries = insertCalls[0][1];
      expect(logEntries).toContainEqual(
        expect.objectContaining({ level: 'debug' })
      );
      expect(logEntries).toContainEqual(
        expect.objectContaining({ level: 'info' })
      );
      expect(logEntries).toContainEqual(
        expect.objectContaining({ level: 'warn' })
      );
      expect(logEntries).toContainEqual(
        expect.objectContaining({ level: 'error' })
      );
    });
  });

  describe('Performance', () => {
    it('measures flush duration', async () => {
      await logger.info('Test message');
      vi.advanceTimersByTime(30000); // Trigger flush

      expect(errorMonitor.logSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'logger.flush',
          duration: expect.any(Number)
        })
      );
    });
  });
});