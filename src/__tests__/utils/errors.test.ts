import { describe, it, expect, vi } from 'vitest';
import { AppError, ValidationError, AuthenticationError, NetworkError, handleError } from '../../utils/errors';
import { errorMonitor } from '../../lib/monitoring';

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AppError', () => {
    it('creates error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 'medium', { test: true });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.severity).toBe('medium');
      expect(error.context).toEqual({ test: true });
    });
  });

  describe('Specialized Errors', () => {
    it('creates ValidationError correctly', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.severity).toBe('low');
      expect(error.context).toEqual({ field: 'email' });
    });

    it('creates AuthenticationError correctly', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.severity).toBe('high');
    });

    it('creates NetworkError correctly', () => {
      const error = new NetworkError('Connection failed');
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.severity).toBe('high');
    });
  });

  describe('handleError', () => {
    it('handles AppError instances', async () => {
      const error = new AppError('Test error', 'TEST_ERROR', 'medium');
      await handleError(error, { operation: 'test' });

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test',
          error: 'Test error',
          severity: 'medium',
          context: expect.objectContaining({
            errorCode: 'TEST_ERROR'
          })
        })
      );
    });

    it('handles regular Error instances', async () => {
      const error = new Error('Test error');
      await handleError(error, { operation: 'test' });

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test',
          error: 'Test error',
          severity: 'medium'
        })
      );
    });

    it('handles unknown errors', async () => {
      await handleError('Something went wrong', { operation: 'test' });

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test',
          error: 'An unknown error occurred',
          severity: 'medium'
        })
      );
    });
  });
});