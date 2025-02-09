import { errorMonitor } from '../lib/monitoring';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high',
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 'low', context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', 'high', context);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 'high', context);
    this.name = 'NetworkError';
  }
}

export async function handleError(error: unknown, context: Record<string, any> = {}) {
  const appError = error instanceof AppError ? error : new AppError(
    error instanceof Error ? error.message : 'An unknown error occurred',
    'UNKNOWN_ERROR',
    'medium',
    context
  );

  await errorMonitor.logError({
    operation: context.operation || 'unknown',
    error: appError.message,
    severity: appError.severity,
    timestamp: new Date().toISOString(),
    context: {
      ...appError.context,
      ...context,
      errorCode: appError.code,
      errorName: appError.name
    }
  });

  return appError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}