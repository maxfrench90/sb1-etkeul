import React from 'react';
import { AlertCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorDetailsProps {
  error: Error;
  context?: {
    operation?: string;
    endpoint?: string;
    timestamp?: Date;
    retryCount?: number;
    maxAttempts?: number;
  };
  onRetry?: () => void;
}

export function ErrorDetails({ error, context, onRetry }: ErrorDetailsProps) {
  const getErrorIcon = () => {
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return <Clock className="w-5 h-5 text-amber-500" />;
    }
    if (error.message.includes('authentication') || error.message.includes('permission')) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const getErrorSuggestion = () => {
    if (error.message.includes('network')) {
      return 'Check your internet connection and try again.';
    }
    if (error.message.includes('authentication')) {
      return 'Try signing out and signing back in.';
    }
    if (error.message.includes('timeout')) {
      return 'The server is taking longer than expected to respond. Please try again.';
    }
    return 'Please try again or contact support if the issue persists.';
  };

  return (
    <div className="bg-red-50 text-red-600 p-4 rounded-md">
      <div className="flex items-start">
        {getErrorIcon()}
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{error.message}</h3>
          <p className="mt-1 text-sm text-red-500">{getErrorSuggestion()}</p>
          {context && (
            <div className="mt-2 text-sm text-red-500">
              {context.operation && (
                <p>Operation: {context.operation}</p>
              )}
              {context.endpoint && (
                <p>Endpoint: {context.endpoint}</p>
              )}
              {context.timestamp && (
                <p>Time: {context.timestamp.toLocaleTimeString()}</p>
              )}
              {context.retryCount !== undefined && context.maxAttempts !== undefined && (
                <p>Attempt {context.retryCount + 1} of {context.maxAttempts}</p>
              )}
            </div>
          )}
          {onRetry && (
            <div className="mt-3">
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Operation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}