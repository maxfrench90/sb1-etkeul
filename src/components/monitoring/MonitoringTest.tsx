import React, { useState } from 'react';
import { errorMonitor } from '../../lib/monitoring';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';

export function MonitoringTest() {
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const testErrorLogging = async () => {
    try {
      // Test low severity error
      await errorMonitor.logError({
        operation: 'test.low',
        error: 'Test low severity error',
        severity: 'low',
        timestamp: new Date().toISOString(),
        context: { test: true }
      });

      // Test medium severity error
      await errorMonitor.logError({
        operation: 'test.medium',
        error: 'Test medium severity error',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        retryCount: 2,
        context: { test: true }
      });

      // Test high severity error
      await errorMonitor.logError({
        operation: 'test.high',
        error: 'Test high severity error',
        severity: 'high',
        timestamp: new Date().toISOString(),
        context: { test: true }
      });

      setToast({
        type: 'success',
        message: 'Error logging tests completed successfully'
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Error logging test failed'
      });
    }
  };

  const testSuccessLogging = async () => {
    try {
      // Test success logging with different attempts
      await errorMonitor.logSuccess({
        operation: 'test.success',
        attempts: 1,
        duration: 150,
        context: { test: true }
      });

      await errorMonitor.logSuccess({
        operation: 'test.retry.success',
        attempts: 3,
        duration: 450,
        context: { test: true, retries: 2 }
      });

      setToast({
        type: 'success',
        message: 'Success logging tests completed'
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Success logging test failed'
      });
    }
  };

  const testMetricsCollection = () => {
    const metrics = errorMonitor.getMetrics();
    setToast({
      type: 'success',
      message: `Metrics collected: ${metrics.totalErrors} errors, ${metrics.successRate.toFixed(1)}% success rate`
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Monitoring Tests</h2>
        
        <div className="space-y-2">
          <Button
            onClick={testErrorLogging}
            className="w-full"
          >
            Test Error Logging
          </Button>
          
          <Button
            onClick={testSuccessLogging}
            className="w-full"
          >
            Test Success Logging
          </Button>
          
          <Button
            onClick={testMetricsCollection}
            className="w-full"
          >
            Test Metrics Collection
          </Button>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}