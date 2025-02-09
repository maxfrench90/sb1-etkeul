import { metricsCollector } from './metricsCollector';

interface PerformanceMetrics {
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  fid: number;  // First Input Delay
  cls: number;  // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observer: PerformanceObserver | null = null;
  private metrics: Partial<PerformanceMetrics> = {};

  private constructor() {
    this.initializeObservers();
    this.trackPageLoadMetrics();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers() {
    // Track Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entry) => {
      this.metrics.lcp = entry.startTime;
      this.recordMetric('LCP', entry.startTime);
    });

    // Track First Input Delay
    this.observeMetric('first-input', (entry) => {
      this.metrics.fid = entry.processingStart - entry.startTime;
      this.recordMetric('FID', this.metrics.fid);
    });

    // Track Cumulative Layout Shift
    this.observeMetric('layout-shift', (entry) => {
      if (!this.metrics.cls) this.metrics.cls = 0;
      this.metrics.cls += entry.value;
      this.recordMetric('CLS', this.metrics.cls);
    });

    // Track resource timing
    this.observeMetric('resource', (entry) => {
      const resource = entry as PerformanceResourceTiming;
      this.recordResourceTiming(resource);
    });
  }

  private observeMetric(type: string, callback: (entry: PerformanceEntry) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ type, buffered: true });
    } catch (e) {
      console.warn(`Failed to observe ${type} performance metric:`, e);
    }
  }

  private trackPageLoadMetrics() {
    window.addEventListener('load', () => {
      // Get First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
        this.recordMetric('FCP', fcpEntry.startTime);
      }

      // Get Time to First Byte
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.recordMetric('TTFB', this.metrics.ttfb);
      }

      // Record overall page load time
      const loadTime = navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.startTime : 0;
      this.recordMetric('PageLoad', loadTime);
    });
  }

  private recordMetric(name: string, value: number) {
    metricsCollector.recordEvent({
      type: 'performance',
      subtype: name.toLowerCase(),
      success: true,
      duration: value,
      metadata: {
        timestamp: Date.now(),
        url: window.location.pathname
      }
    });
  }

  private recordResourceTiming(resource: PerformanceResourceTiming) {
    const timing = {
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType,
      cache: resource.transferSize === 0 ? 'hit' : 'miss'
    };

    metricsCollector.recordEvent({
      type: 'performance',
      subtype: 'resource',
      success: true,
      duration: resource.duration,
      metadata: timing
    });
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  measureComponentTiming(componentName: string, phase: 'mount' | 'update' | 'unmount', duration: number) {
    this.recordMetric(`Component_${componentName}_${phase}`, duration);
  }

  measureAsyncOperation(operation: string, startTime: number) {
    const duration = Date.now() - startTime;
    this.recordMetric(`Async_${operation}`, duration);
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();