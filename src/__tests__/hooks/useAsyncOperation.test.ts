import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { errorMonitor } from '../../lib/monitoring';

describe('useAsyncOperation', () => {
  it('handles successful operations', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() =>
      useAsyncOperation(mockFn, { operation: 'test' })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('success');
    expect(errorMonitor.logSuccess).toHaveBeenCalled();
  });

  it('handles operation errors', async () => {
    const error = new Error('Operation failed');
    const mockFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() =>
      useAsyncOperation(mockFn, { operation: 'test' })
    );

    await act(async () => {
      try {
        await result.current.execute();
      } catch {}
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeNull();
    expect(errorMonitor.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'test',
        error: error.message
      })
    );
  });

  it('resets state correctly', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() =>
      useAsyncOperation(mockFn, { operation: 'test' })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});