import { supabase } from '../supabase';
import type { ErrorLog, SuccessLog, ErrorMetrics } from './types';

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errorBuffer: ErrorLog[] = [];
  private successBuffer: SuccessLog[] = [];
  private readonly bufferSize = 10;
  private readonly flushInterval = 30000; // 30 seconds
  private flushTimeout: NodeJS.Timeout | null = null;
  private isProcessing = false;

  private constructor() {
    this.scheduleFlush();
  }

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private scheduleFlush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => this.flush(), this.flushInterval);
  }

  async logError(error: ErrorLog): Promise<void> {
    // Deduplicate similar errors within a short time window
    const isDuplicate = this.errorBuffer.some(e => 
      e.operation === error.operation && 
      e.error === error.error &&
      Date.now() - new Date(e.timestamp).getTime() < 5000
    );

    if (!isDuplicate) {
      this.errorBuffer.push(error);

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logged:', error);
      }
      
      if (error.severity === 'high') {
        await this.notifyError(error);
      }
      
      if (this.errorBuffer.length >= this.bufferSize) {
        await this.flush();
      }
    }
  }

  async logSuccess(success: SuccessLog): Promise<void> {
    this.successBuffer.push(success);
    
    if (this.successBuffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  private async notifyError(error: ErrorLog): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const notificationPayload = {
        type: 'error',
        severity: error.severity,
        operation: error.operation,
        message: error.error,
        timestamp: error.timestamp,
        context: error.context,
        user_id: user.id
      };

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationPayload);

      if (insertError) throw insertError;
    } catch (err) {
      console.error('Failed to send error notification:', err);
    }
  }

  private async flush(): Promise<void> {
    if (this.isProcessing || (this.errorBuffer.length === 0 && this.successBuffer.length === 0)) {
      return;
    }

    this.isProcessing = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const errors = [...this.errorBuffer];
      const successes = [...this.successBuffer];
      
      // Clear buffers before processing to prevent data loss
      this.errorBuffer = [];
      this.successBuffer = [];

      // Group similar errors
      const groupedErrors = errors.reduce((acc, error) => {
        const key = `${error.operation}:${error.error}`;
        if (!acc[key]) {
          acc[key] = {
            ...error,
            count: 1,
            first_seen: error.timestamp,
            last_seen: error.timestamp
          };
        } else {
          acc[key].count++;
          acc[key].last_seen = error.timestamp;
        }
        return acc;
      }, {} as Record<string, any>);

      await Promise.all([
        this.saveErrors(Object.values(groupedErrors), user.id),
        this.saveSuccesses(successes, user.id)
      ]);
    } catch (err) {
      // Restore items to buffer if save fails
      this.errorBuffer = [...this.errorBuffer, ...this.errorBuffer];
      this.successBuffer = [...this.successBuffer, ...this.successBuffer];
      console.error('Error flushing logs:', err);
    } finally {
      this.isProcessing = false;
      this.scheduleFlush();
    }
  }

  private async saveErrors(errors: any[], userId: string): Promise<void> {
    if (errors.length === 0) return;

    const { error } = await supabase
      .from('error_logs')
      .insert(errors.map(error => ({
        ...error,
        user_id: userId,
        created_at: new Date().toISOString()
      })));

    if (error) {
      console.error('Failed to save error logs:', error);
      throw error;
    }
  }

  private async saveSuccesses(successes: SuccessLog[], userId: string): Promise<void> {
    if (successes.length === 0) return;

    const { error } = await supabase
      .from('success_logs')
      .insert(successes.map(success => ({
        ...success,
        user_id: userId,
        created_at: new Date().toISOString()
      })));

    if (error) {
      console.error('Failed to save success logs:', error);
      throw error;
    }
  }

  getMetrics(): ErrorMetrics {
    const totalErrors = this.errorBuffer.length;
    const totalSuccesses = this.successBuffer.length;
    const totalOperations = totalErrors + totalSuccesses;

    const errorsByOperation = this.errorBuffer.reduce((acc, log) => {
      acc[log.operation] = (acc[log.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRetries = this.errorBuffer.reduce((sum, log) => sum + (log.retryCount || 0), 0);
    const totalDuration = this.successBuffer.reduce((sum, log) => sum + log.duration, 0);

    return {
      totalErrors,
      errorsByOperation,
      averageRetries: totalErrors > 0 ? totalRetries / totalErrors : 0,
      successRate: totalOperations > 0 ? (totalSuccesses / totalOperations) * 100 : 100,
      averageDuration: totalSuccesses > 0 ? totalDuration / totalSuccesses : 0
    };
  }

  destroy() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flush().catch(console.error);
  }
}

export const errorMonitor = ErrorMonitor.getInstance();