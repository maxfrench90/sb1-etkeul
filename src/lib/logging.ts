import { supabase } from './supabase';
import { errorMonitor } from './monitoring';
import { performance } from './performance';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  user_id?: string;
}

interface AuditEntry {
  action: string;
  entity_type: string;
  entity_id: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  user_id?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

class Logger {
  private static instance: Logger;
  private logBuffer: LogEntry[] = [];
  private auditBuffer: AuditEntry[] = [];
  private readonly bufferSize = 50;
  private readonly flushInterval = 30000; // 30 seconds
  private flushTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.scheduleFlush();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  private scheduleFlush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => this.flush(), this.flushInterval);
  }

  private async flush() {
    const startTime = performance.now();

    try {
      if (this.logBuffer.length > 0) {
        const { error: logError } = await supabase
          .from('logs')
          .insert(this.logBuffer);

        if (logError) throw logError;
        this.logBuffer = [];
      }

      if (this.auditBuffer.length > 0) {
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert(this.auditBuffer);

        if (auditError) throw auditError;
        this.auditBuffer = [];
      }

      const duration = performance.now() - startTime;
      await errorMonitor.logSuccess({
        operation: 'logger.flush',
        attempts: 1,
        duration,
        context: {
          logCount: this.logBuffer.length,
          auditCount: this.auditBuffer.length
        }
      });
    } catch (error) {
      await errorMonitor.logError({
        operation: 'logger.flush',
        error: error instanceof Error ? error.message : 'Failed to flush logs',
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    } finally {
      this.scheduleFlush();
    }
  }

  async log(level: LogEntry['level'], message: string, context?: Record<string, any>) {
    try {
      const user = await this.getCurrentUser();
      const entry: LogEntry = {
        level,
        message,
        context,
        timestamp: new Date().toISOString(),
        user_id: user?.id
      };

      this.logBuffer.push(entry);

      if (this.logBuffer.length >= this.bufferSize) {
        await this.flush();
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        const logFn = console[level] || console.log;
        logFn(`[${level.toUpperCase()}] ${message}`, context);
      }
    } catch (error) {
      console.error('Failed to log:', error);
    }
  }

  async audit(
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    try {
      const user = await this.getCurrentUser();
      const entry: AuditEntry = {
        action,
        entity_type: entityType,
        entity_id: entityId,
        changes,
        metadata,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
        ip_address: window.clientInformation?.userAgent,
        user_agent: navigator.userAgent
      };

      this.auditBuffer.push(entry);

      if (this.auditBuffer.length >= this.bufferSize) {
        await this.flush();
      }

      // Track significant actions
      if (['create', 'update', 'delete'].includes(action)) {
        await errorMonitor.logSuccess({
          operation: `${entityType}.${action}`,
          attempts: 1,
          duration: 0,
          context: {
            entityId,
            changes
          }
        });
      }
    } catch (error) {
      await errorMonitor.logError({
        operation: 'logger.audit',
        error: error instanceof Error ? error.message : 'Failed to create audit log',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: {
          action,
          entityType,
          entityId
        }
      });
    }
  }

  async debug(message: string, context?: Record<string, any>) {
    await this.log('debug', message, context);
  }

  async info(message: string, context?: Record<string, any>) {
    await this.log('info', message, context);
  }

  async warn(message: string, context?: Record<string, any>) {
    await this.log('warn', message, context);
  }

  async error(message: string, context?: Record<string, any>) {
    await this.log('error', message, context);
  }

  destroy() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flush().catch(console.error);
  }
}

export const logger = Logger.getInstance();