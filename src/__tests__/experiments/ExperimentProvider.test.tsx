import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { ExperimentProvider, useExperiment } from '../../components/experiments/ExperimentProvider';
import { analytics } from '../../lib/analytics';

describe('ExperimentProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('assigns variants consistently', () => {
    const { result: result1 } = renderHook(
      () => useExperiment('booking-form-layout'),
      { wrapper: ExperimentProvider }
    );

    const { result: result2 } = renderHook(
      () => useExperiment('booking-form-layout'),
      { wrapper: ExperimentProvider }
    );

    expect(result1.current).toBe(result2.current);
  });

  it('tracks experiment views', () => {
    const { result } = renderHook(
      () => useExperiment('booking-form-layout'),
      { wrapper: ExperimentProvider }
    );

    expect(analytics.trackExperiment).toHaveBeenCalledWith(
      'booking-form-layout',
      result.current
    );
  });
});