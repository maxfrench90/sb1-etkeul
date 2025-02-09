import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { PerformanceMonitor } from '../../components/performance/PerformanceMonitor';
import { performanceMonitor } from '../../lib/monitoring/performanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performanceMonitor, 'measureComponentTiming');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('measures mount timing', () => {
    render(
      <PerformanceMonitor componentName="TestComponent">
        <div>Test Content</div>
      </PerformanceMonitor>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(performanceMonitor.measureComponentTiming).toHaveBeenCalledWith(
      'TestComponent',
      'mount',
      expect.any(Number)
    );
  });

  it('measures unmount timing', () => {
    const { unmount } = render(
      <PerformanceMonitor componentName="TestComponent">
        <div>Test Content</div>
      </PerformanceMonitor>
    );

    act(() => {
      unmount();
      vi.advanceTimersByTime(100);
    });

    expect(performanceMonitor.measureComponentTiming).toHaveBeenCalledWith(
      'TestComponent',
      'unmount',
      expect.any(Number)
    );
  });

  it('measures update timing', () => {
    const { rerender } = render(
      <PerformanceMonitor componentName="TestComponent">
        <div>Test Content</div>
      </PerformanceMonitor>
    );

    act(() => {
      rerender(
        <PerformanceMonitor componentName="TestComponent">
          <div>Updated Content</div>
        </PerformanceMonitor>
      );
      vi.advanceTimersByTime(100);
    });

    expect(performanceMonitor.measureComponentTiming).toHaveBeenCalledWith(
      'TestComponent',
      'update',
      expect.any(Number)
    );
  });
});