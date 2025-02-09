import { metricsCollector } from './monitoring';

// Initialize analytics based on environment
const isProduction = import.meta.env.PROD;
const analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

interface EventOptions {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

interface PageViewOptions {
  title: string;
  path: string;
  metadata?: Record<string, any>;
}

class Analytics {
  private static instance: Analytics;
  private initialized = false;

  private constructor() {
    if (isProduction && analyticsEnabled) {
      this.initializeAnalytics();
    }
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private initializeAnalytics() {
    if (this.initialized) return;

    // Initialize Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', import.meta.env.VITE_GA_ID);

    this.initialized = true;
  }

  trackEvent({ category, action, label, value, metadata }: EventOptions) {
    if (!this.initialized) return;

    // Track in Google Analytics
    window.gtag?.('event', action, {
      event_category: category,
      event_label: label,
      value,
      ...metadata
    });

    // Also track in our metrics system
    metricsCollector.recordEvent({
      type: 'user_event',
      subtype: category,
      success: true,
      metadata: {
        action,
        label,
        value,
        ...metadata
      }
    });
  }

  trackPageView({ title, path, metadata }: PageViewOptions) {
    if (!this.initialized) return;

    // Track in Google Analytics
    window.gtag?.('event', 'page_view', {
      page_title: title,
      page_path: path,
      ...metadata
    });

    // Track in metrics system
    metricsCollector.recordEvent({
      type: 'page_view',
      success: true,
      metadata: {
        title,
        path,
        ...metadata
      }
    });
  }

  trackError(error: Error, context?: Record<string, any>) {
    if (!this.initialized) return;

    window.gtag?.('event', 'error', {
      event_category: 'Error',
      event_label: error.message,
      ...context
    });
  }

  // A/B Testing integration
  trackExperiment(experimentId: string, variant: string) {
    if (!this.initialized) return;

    window.gtag?.('event', 'experiment_impression', {
      experiment_id: experimentId,
      variant_id: variant
    });
  }
}

export const analytics = Analytics.getInstance();