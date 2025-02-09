import { RateLimitConfig } from './types';

/**
 * Rate limiter for controlling accessibility audit frequency
 */
export class RateLimiter {
  private requests: number = 0;
  private lastReset: number = Date.now();

  /**
   * Creates a new rate limiter
   * @param {RateLimitConfig} config - Rate limiting configuration
   */
  constructor(private config: RateLimitConfig) {}

  /**
   * Checks if a new request can be made within the rate limit
   * @returns {boolean} True if request is allowed
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    if (now - this.lastReset > this.config.interval) {
      this.requests = 0;
      this.lastReset = now;
    }
    return this.requests < this.config.limit;
  }

  /**
   * Increments the request counter
   */
  incrementRequests(): void {
    this.requests++;
  }

  /**
   * Resets the rate limiter state
   */
  reset(): void {
    this.requests = 0;
    this.lastReset = Date.now();
  }
}