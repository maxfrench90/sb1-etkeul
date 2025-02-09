import { AxeResults } from 'axe-core';
import { errorMonitor } from '../monitoring';
import { performance } from '../performance';
import { PriorityQueue } from './queue';
import { RateLimiter } from './rateLimiter';
import { DEFAULT_RULES, DEFAULT_CHECKS, mergeRules } from './rules';
import type { 
  AccessibilityViolation,
  AuditConfig,
  AuditRequest,
  AuditResult
} from './types';

class AccessibilityMonitor {
  private static instance: AccessibilityMonitor;
  private initialized = false;
  private axe: typeof import('axe-core') | null = null;
  private isRunning = false;
  private readonly queue: PriorityQueue;
  private readonly rateLimiter: RateLimiter;
  private processingInterval: NodeJS.Timeout | null = null;
  private retryAttempts = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  private constructor() {
    this.queue = new PriorityQueue();
    this.rateLimiter = new RateLimiter({
      limit: 10,
      interval: 60000
    });

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

  private async initializeMonitoring(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if axe is already running
      if (window.axe?.isRunning) {
        throw new Error('Axe is already running');
      }

      const axeCore = await import('axe-core');
      this.axe = axeCore.default;
      
      this.axe.configure({
        rules: mergeRules(),
        resultTypes: ['violations'],
        checks: DEFAULT_CHECKS,
        // Add timeout for long-running audits
        timeout: 10000,
        // Handle frames more robustly
        allowedOrigins: ['<same_origin>'],
        // Improve error messages
        noHtml: true
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
        timestamp: new Date().toISOString(),
        context: { retryAttempts: this.retryAttempts }
      });

      // Retry initialization with exponential backoff
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
        setTimeout(() => this.initializeMonitoring(), delay);
      }
    }
  }

  private startQueueProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (this.isRunning || !this.rateLimiter.canMakeRequest()) return;

      const item = this.queue.dequeue();
      if (item) {
        this.isRunning = true;
        this.rateLimiter.incrementRequests();

        try {
          // Add timeout for audit processing
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Audit timeout')), 15000);
          });

          const auditPromise = this.runAuditInternal(item.request.config);
          const violations = await Promise.race([auditPromise, timeoutPromise]);
          
          item.resolve(violations as AccessibilityViolation[]);
        } catch (error) {
          item.reject(error instanceof Error ? error : new Error('Audit failed'));
        } finally {
          this.isRunning = false;
        }
      }
    }, 100);
  }

  private async runAuditInternal(config?: AuditConfig): Promise<AccessibilityViolation[]> {
    const startTime = performance.now();

    if (!this.initialized || !this.axe) {
      await this.initializeMonitoring();
    }

    try {
      // Check if document is ready
      if (!document.readyState === 'complete') {
        throw new Error('Document not ready');
      }

      // Check if axe is already running
      if (window.axe?.isRunning) {
        throw new Error('Axe is already running');
      }

      const results = await this.axe?.run(document, {
        rules: config?.rules ? mergeRules(config.rules) : undefined,
        exclude: config?.exclude,
        // Add retry options
        runOnly: config?.rules,
        // Improve error context
        elementRef: true,
        ancestry: true
      }) as AxeResults;
      
      const violations = results?.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact as AccessibilityViolation['impact'],
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        element: violation.nodes[0]?.html,
        // Add more context for debugging
        target: violation.nodes[0]?.target?.join(' '),
        failureSummary: violation.nodes[0]?.failureSummary
      })) || [];

      const duration = performance.now() - startTime;
      await this.logAuditResult({
        violations,
        timestamp: new Date().toISOString(),
        duration
      });

      return violations;
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          await errorMonitor.logError({
            operation: 'accessibility.audit',
            error: 'Audit timeout',
            severity: 'medium',
            timestamp: new Date().toISOString(),
            context: { timeout: true }
          });
          return [];
        }

        if (error.message.includes('already running')) {
          await errorMonitor.logError({
            operation: 'accessibility.audit',
            error: 'Concurrent audit attempted',
            severity: 'low',
            timestamp: new Date().toISOString()
          });
          // Wait for current audit to finish
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.runAuditInternal(config);
        }
      }

      await errorMonitor.logError({
        operation: 'accessibility.audit',
        error: error instanceof Error ? error.message : 'Accessibility audit failed',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: {
          config,
          documentReady: document.readyState,
          axeRunning: window.axe?.isRunning
        }
      });
      return [];
    }
  }

  private async logAuditResult(result: AuditResult): Promise<void> {
    await errorMonitor.logSuccess({
      operation: 'accessibility.audit',
      attempts: 1,
      duration: result.duration,
      context: {
        violationCount: result.violations.length,
        timestamp: result.timestamp
      }
    });

    result.violations.forEach(violation => {
      errorMonitor.logError({
        operation: 'accessibility.violation',
        error: violation.description,
        severity: violation.impact === 'critical' ? 'high' : 'medium',
        timestamp: result.timestamp,
        context: {
          violationId: violation.id,
          impact: violation.impact,
          element: violation.element,
          target: violation.target,
          failureSummary: violation.failureSummary
        }
      });
    });
  }

  async runAudit(priority: number = 1, config?: AuditConfig): Promise<AccessibilityViolation[]> {
    // Validate priority
    if (priority < 1 || priority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }

    // Validate config
    if (config?.rules?.length === 0) {
      throw new Error('Rules array cannot be empty');
    }

    return new Promise((resolve, reject) => {
      this.queue.enqueue({
        request: { priority, config },
        resolve,
        reject
      });
    });
  }

  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    this.queue.clear();
    this.rateLimiter.reset();
  }
}

export const accessibilityMonitor = AccessibilityMonitor.getInstance();