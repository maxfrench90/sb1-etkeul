import { AxeResults } from 'axe-core';
import { errorMonitor } from './monitoring';
import { performance } from './performance';

interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  element?: string;
  help?: string;
  helpUrl?: string;
}

// Priority queue implementation for audit requests
class PriorityQueue<T> {
  private items: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// Rate limiter for audit requests
class RateLimiter {
  private requests: number = 0;
  private lastReset: number = Date.now();
  private readonly limit: number;
  private readonly interval: number;

  constructor(limit: number = 10, interval: number = 60000) {
    this.limit = limit;
    this.interval = interval;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    if (now - this.lastReset > this.interval) {
      this.requests = 0;
      this.lastReset = now;
    }
    return this.requests < this.limit;
  }

  incrementRequests() {
    this.requests++;
  }
}

class AccessibilityMonitor {
  private static instance: AccessibilityMonitor;
  private violations: AccessibilityViolation[] = [];
  private initialized = false;
  private axe: typeof import('axe-core') | null = null;
  private isRunning = false;
  private readonly queue: PriorityQueue<() => Promise<AccessibilityViolation[]>>;
  private readonly rateLimiter: RateLimiter;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.queue = new PriorityQueue();
    this.rateLimiter = new RateLimiter();

    if (process.env.NODE_ENV === 'development') {
      this.initializeMonitoring();
      this.startQueueProcessing();
    }
  }

  static getInstance(): AccessibilityMonitor {
    if (!AccessibilityMonitor.instance) {
      AccessibilityMonitor.instance = new AccessibilityMonitor();
    }
    return AccessibilityMonitor.instance;
  }

  private async initializeMonitoring() {
    if (this.initialized) return;

    try {
      const axeCore = await import('axe-core');
      this.axe = axeCore.default;
      
      this.axe.configure({
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'aria-roles', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'image-alt', enabled: true },
          { id: 'label', enabled: true },
          { id: 'link-name', enabled: true }
        ],
        resultTypes: ['violations'],
        checks: [
          { id: 'color-contrast', options: { noScroll: true } }
        ]
      });

      this.initialized = true;

      await errorMonitor.logSuccess({
        operation: 'accessibility.init',
        attempts: 1,
        duration: 0,
        context: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      await errorMonitor.logError({
        operation: 'accessibility.init',
        error: error instanceof Error ? error.message : 'Failed to initialize axe-core',
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }
  }

  private startQueueProcessing() {
    this.processingInterval = setInterval(async () => {
      if (this.isRunning || !this.rateLimiter.canMakeRequest()) return;

      const nextAudit = this.queue.dequeue();
      if (nextAudit) {
        this.isRunning = true;
        this.rateLimiter.incrementRequests();

        try {
          const violations = await nextAudit();
          this.violations = violations;
        } catch (error) {
          console.error('Audit failed:', error);
        } finally {
          this.isRunning = false;
        }
      }
    }, 100); // Process queue every 100ms
  }

  async runAudit(priority: number = 1): Promise<AccessibilityViolation[]> {
    return new Promise((resolve) => {
      const auditFn = async () => {
        const startTime = performance.now();
        this.clearViolations();

        if (!this.initialized || !this.axe) {
          await this.initializeMonitoring();
        }

        try {
          const results = await this.axe?.run(document) as AxeResults;
          
          const violations = results?.violations.map(violation => ({
            id: violation.id,
            impact: violation.impact as AccessibilityViolation['impact'],
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            element: violation.nodes[0]?.html
          })) || [];

          // Track audit performance
          const duration = performance.now() - startTime;
          await errorMonitor.logSuccess({
            operation: 'accessibility.audit',
            attempts: 1,
            duration,
            context: {
              violationCount: violations.length,
              timestamp: new Date().toISOString()
            }
          });

          return violations;
        } catch (error) {
          await errorMonitor.logError({
            operation: 'accessibility.audit',
            error: error instanceof Error ? error.message : 'Accessibility audit failed',
            severity: 'medium',
            timestamp: new Date().toISOString()
          });
          return [];
        }
      };

      this.queue.enqueue(async () => {
        const violations = await auditFn();
        resolve(violations);
        return violations;
      }, priority);
    });
  }

  private reportViolation(violation: AccessibilityViolation) {
    this.violations.push(violation);

    errorMonitor.logError({
      operation: 'accessibility.violation',
      error: violation.description,
      severity: violation.impact === 'critical' ? 'high' : 'medium',
      timestamp: new Date().toISOString(),
      context: {
        violationId: violation.id,
        impact: violation.impact,
        element: violation.element
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.warn('Accessibility violation:', violation);
    }
  }

  getViolations(): AccessibilityViolation[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  destroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

export const accessibilityMonitor = AccessibilityMonitor.getInstance();