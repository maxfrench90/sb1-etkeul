import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
}

export function MonitoringVerification() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setResults([]);
    setRunning(true);

    try {
      // Test 1: Verify table structure
      addResult({
        name: 'Table Structure',
        status: 'pending'
      });

      const { data: tables, error: tableError } = await supabase
        .from('error_logs')
        .select('id')
        .limit(1);

      if (tableError) {
        addResult({
          name: 'Table Structure',
          status: 'error',
          message: 'Error accessing tables'
        });
        return;
      }

      addResult({
        name: 'Table Structure',
        status: 'success',
        message: 'Tables accessible and properly structured'
      });

      // Test 2: RLS Policies
      addResult({
        name: 'RLS Policies',
        status: 'pending'
      });

      // Try to access another user's logs (should fail)
      const { data: unauthorized, error: rlsError } = await supabase
        .from('error_logs')
        .select('*')
        .neq('user_id', (await supabase.auth.getUser()).data.user?.id || '');

      if (!rlsError) {
        addResult({
          name: 'RLS Policies',
          status: 'error',
          message: 'RLS policies not properly enforced'
        });
        return;
      }

      addResult({
        name: 'RLS Policies',
        status: 'success',
        message: 'RLS policies working correctly'
      });

      // Test 3: Error Logging
      addResult({
        name: 'Error Logging',
        status: 'pending'
      });

      await errorMonitor.logError({
        operation: 'test.verification',
        error: 'Test error message',
        severity: 'low',
        timestamp: new Date().toISOString(),
        context: { test: true }
      });

      const { data: errorLogs } = await supabase
        .from('error_logs')
        .select('*')
        .eq('operation', 'test.verification')
        .limit(1);

      if (!errorLogs?.length) {
        addResult({
          name: 'Error Logging',
          status: 'error',
          message: 'Error log not saved'
        });
        return;
      }

      addResult({
        name: 'Error Logging',
        status: 'success',
        message: 'Error logging working correctly'
      });

      // Test 4: Success Logging
      addResult({
        name: 'Success Logging',
        status: 'pending'
      });

      await errorMonitor.logSuccess({
        operation: 'test.verification',
        attempts: 1,
        duration: 100,
        context: { test: true }
      });

      const { data: successLogs } = await supabase
        .from('success_logs')
        .select('*')
        .eq('operation', 'test.verification')
        .limit(1);

      if (!successLogs?.length) {
        addResult({
          name: 'Success Logging',
          status: 'error',
          message: 'Success log not saved'
        });
        return;
      }

      addResult({
        name: 'Success Logging',
        status: 'success',
        message: 'Success logging working correctly'
      });

      // Test 5: Metrics Collection
      addResult({
        name: 'Metrics Collection',
        status: 'pending'
      });

      const metrics = errorMonitor.getMetrics();
      
      if (
        metrics.totalErrors === undefined ||
        metrics.successRate === undefined ||
        metrics.averageRetries === undefined
      ) {
        addResult({
          name: 'Metrics Collection',
          status: 'error',
          message: 'Metrics not properly collected'
        });
        return;
      }

      addResult({
        name: 'Metrics Collection',
        status: 'success',
        message: 'Metrics collection working correctly'
      });

      setToast({
        type: 'success',
        message: 'All monitoring tests completed successfully'
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Test suite failed to complete'
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            Monitoring System Verification
          </h2>
          <Button
            onClick={runTests}
            disabled={running}
            className="flex items-center gap-2"
          >
            {running ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Tests'
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-md"
            >
              <div className="flex items-center gap-3">
                {result.status === 'pending' ? (
                  <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                ) : result.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{result.name}</h3>
                  {result.message && (
                    <p className="text-sm text-gray-500">{result.message}</p>
                  )}
                </div>
              </div>
              <span className={`text-sm font-medium ${
                result.status === 'success'
                  ? 'text-green-600'
                  : result.status === 'error'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}>
                {result.status.toUpperCase()}
              </span>
            </div>
          ))}
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