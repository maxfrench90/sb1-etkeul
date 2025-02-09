import { metricsCollector } from './monitoring';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

const defaultConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  shouldRetry: () => true
};

export class RetryStrategy {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();

        if (attempt > 1) {
          metricsCollector.recordEvent({
            type: 'retry',
            subtype: 'success',
            success: true,
            duration: Date.now() - startTime,
            metadata: {
              context,
              attempts: attempt
            }
          });
        }

        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Operation failed');

        metricsCollector.recordEvent({
          type: 'retry',
          subtype: 'failure',
          success: false,
          error: lastError.message,
          metadata: {
            context,
            attempt,
            maxAttempts: this.config.maxAttempts
          }
        });

        if (
          attempt === this.config.maxAttempts ||
          !this.config.shouldRetry(err, attempt)
        ) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        this.config.onRetry?.(err, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    const jitter = Math.random() * 1000;
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, attempt - 1) + jitter,
      this.config.maxDelay
    );
    return delay;
  }
}