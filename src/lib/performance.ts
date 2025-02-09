import { metricsCollector } from './monitoring';

class PerformanceManager {
  private static instance: PerformanceManager;
  private observer: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private isSupported: boolean;
  private lastTimestamp: number;
  private performanceNow: () => number;

  private constructor() {
    // Check if Performance API is supported
    this.isSupported = typeof window !== 'undefined' && 
      'performance' in window &&
      typeof window.performance.now === 'function';
    
    // Store reference to native performance.now to avoid recursion
    this.performanceNow = this.isSupported 
      ? window.performance.now.bind(window.performance)
      : () => Date.now();
    
    this.lastTimestamp = this.performanceNow();
    
    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  private initializeObservers() {
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            metricsCollector.recordEvent({
              type: 'performance',
              subtype: entry.entryType,
              success: true,
              duration: entry.duration || 0,
              metadata: {
                name: entry.name,
                startTime: entry.startTime
              }
            });
          });
        });

        this.observer.observe({ 
          entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
        });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }

    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLImageElement;
              if (element.dataset.src) {
                element.src = element.dataset.src;
                element.removeAttribute('data-src');
                this.intersectionObserver?.unobserve(element);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }
  }

  now(): number {
    return this.performanceNow();
  }

  trackComponentRender(componentName: string, startTime: number) {
    if (!this.isSupported) return;
    
    const endTime = this.now();
    const duration = endTime - startTime;
    
    metricsCollector.recordEvent({
      type: 'performance',
      subtype: 'component_render',
      success: true,
      duration,
      metadata: { componentName }
    });
  }

  observeImage(imgElement: HTMLImageElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(imgElement);
    }
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

export const performance = PerformanceManager.getInstance();