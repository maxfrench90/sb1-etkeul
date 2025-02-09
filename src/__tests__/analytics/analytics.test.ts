import { describe, it, expect, vi } from 'vitest';
import { analytics } from '../../lib/analytics';
import { metricsCollector } from '../../lib/monitoring';

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.gtag = vi.fn();
  });

  it('tracks events correctly', () => {
    analytics.trackEvent({
      category: 'Test',
      action: 'Click',
      label: 'Button'
    });

    expect(window.gtag).toHaveBeenCalled();
    expect(metricsCollector.recordEvent).toHaveBeenCalled();
  });

  it('tracks page views', () => {
    analytics.trackPageView({
      title: 'Home',
      path: '/'
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.any(Object));
  });

  it('tracks experiments', () => {
    analytics.trackExperiment('test-exp', 'variant-a');

    expect(window.gtag).toHaveBeenCalledWith('event', 'experiment_impression', {
      experiment_id: 'test-exp',
      variant_id: 'variant-a'
    });
  });
});