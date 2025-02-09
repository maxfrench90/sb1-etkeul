import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAccessibilityAudit } from '../../hooks/useAccessibilityAudit';
import { accessibilityMonitor } from '../../lib/accessibility/monitor';
import { metricsCollector } from '../../lib/monitoring';

describe('useAccessibilityAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('runs initial audit on mount when enabled', async () => {
    const mockViolations = [
      { id: 'button-name', impact: 'serious' as const, description: 'Button has no name' }
    ];

    vi.mocked(accessibilityMonitor.runAudit).mockResolvedValueOnce(mockViolations);

    const { result, waitForNextUpdate } = renderHook(() => useAccessibilityAudit({
      enabled: true
    }));

    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();

    expect(result.current.violations).toEqual(mockViolations);
    expect(result.current.loading).toBe(false);
    expect(accessibilityMonitor.runAudit).toHaveBeenCalled();
  });

  it('does not run audit when disabled', () => {
    renderHook(() => useAccessibilityAudit({
      enabled: false
    }));

    expect(accessibilityMonitor.runAudit).not.toHaveBeenCalled();
  });

  it('handles audit errors', async () => {
    const error = new Error('Audit failed');
    vi.mocked(accessibilityMonitor.runAudit).mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useAccessibilityAudit({
      enabled: true
    }));

    await waitForNextUpdate();

    expect(result.current.error).toBe(error);
    expect(metricsCollector.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'accessibility',
        success: false,
        error: error.message
      })
    );
  });

  it('calls onViolation callback when violations are found', async () => {
    const mockViolations = [
      { id: 'color-contrast', impact: 'serious' as const, description: 'Poor contrast' }
    ];
    const onViolation = vi.fn();

    vi.mocked(accessibilityMonitor.runAudit).mockResolvedValueOnce(mockViolations);

    const { waitForNextUpdate } = renderHook(() => useAccessibilityAudit({
      enabled: true,
      onViolation
    }));

    await waitForNextUpdate();

    expect(onViolation).toHaveBeenCalledWith(mockViolations);
  });

  it('applies automatic fixes when autoFix is enabled', async () => {
    // Create test content
    document.body.innerHTML = `
      <img src="test.jpg">
      <button></button>
    `;

    const mockViolations = [
      { id: 'image-alt', impact: 'serious' as const, description: 'Image has no alt text' },
      { id: 'button-name', impact: 'serious' as const, description: 'Button has no name' }
    ];

    vi.mocked(accessibilityMonitor.runAudit).mockResolvedValueOnce(mockViolations);

    const { waitForNextUpdate } = renderHook(() => useAccessibilityAudit({
      enabled: true,
      autoFix: true
    }));

    await waitForNextUpdate();

    // Verify fixes were applied
    expect(document.querySelector('img')?.getAttribute('alt')).toBe('Image');
    expect(document.querySelector('button')?.textContent).toBe('Button');
  });

  it('clears violations on unmount', () => {
    const mockViolations = [
      { id: 'test', impact: 'serious' as const, description: 'Test violation' }
    ];

    vi.mocked(accessibilityMonitor.runAudit).mockResolvedValueOnce(mockViolations);

    const { result, unmount } = renderHook(() => useAccessibilityAudit({
      enabled: true
    }));

    act(() => {
      unmount();
    });

    expect(result.current.violations).toEqual([]);
  });

  it('tracks audit performance', async () => {
    const { waitForNextUpdate } = renderHook(() => useAccessibilityAudit({
      enabled: true
    }));

    await waitForNextUpdate();

    expect(metricsCollector.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'accessibility',
        subtype: 'audit',
        duration: expect.any(Number)
      })
    );
  });
});