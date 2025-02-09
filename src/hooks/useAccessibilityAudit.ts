import { useEffect, useCallback, useState } from 'react';
import { accessibilityMonitor } from '../lib/accessibility/monitor';
import { metricsCollector } from '../lib/monitoring';
import type { AccessibilityViolation, AuditConfig } from '../lib/accessibility/types';

interface UseAccessibilityAuditOptions {
  enabled?: boolean;
  priority?: number;
  config?: AuditConfig;
  autoFix?: boolean;
  onViolation?: (violations: AccessibilityViolation[]) => void;
}

/**
 * Custom hook for running accessibility audits on components
 * 
 * @param options Configuration options for the accessibility audit
 * @returns Object containing audit state and control functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { violations, runAudit } = useAccessibilityAudit({
 *     enabled: true,
 *     priority: 2,
 *     onViolation: (violations) => {
 *       console.warn('Accessibility issues found:', violations);
 *     }
 *   });
 * 
 *   return (
 *     <div>
 *       {violations.length > 0 && (
 *         <div role="alert">
 *           Found {violations.length} accessibility issues
 *         </div>
 *       )}
 *       <button onClick={runAudit}>Check Accessibility</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccessibilityAudit({
  enabled = process.env.NODE_ENV === 'development',
  priority = 1,
  config,
  autoFix = false,
  onViolation
}: UseAccessibilityAuditOptions = {}) {
  const [violations, setViolations] = useState<AccessibilityViolation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runAudit = useCallback(async () => {
    if (!enabled) return;

    const startTime = performance.now();
    setLoading(true);
    setError(null);

    try {
      const results = await accessibilityMonitor.runAudit(priority, config);
      setViolations(results);
      onViolation?.(results);

      if (autoFix) {
        applyAutomaticFixes(results);
      }

      // Track audit performance
      metricsCollector.recordEvent({
        type: 'accessibility',
        subtype: 'audit',
        success: true,
        duration: performance.now() - startTime,
        metadata: {
          violationCount: results.length,
          config
        }
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Audit failed');
      setError(error);
      
      metricsCollector.recordEvent({
        type: 'accessibility',
        subtype: 'audit',
        success: false,
        error: error.message,
        duration: performance.now() - startTime
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, priority, config, autoFix, onViolation]);

  // Run initial audit on mount
  useEffect(() => {
    if (enabled) {
      runAudit();
    }

    // Cleanup
    return () => {
      setViolations([]);
      setError(null);
    };
  }, [enabled, runAudit]);

  // Apply automatic fixes for common issues
  const applyAutomaticFixes = (violations: AccessibilityViolation[]) => {
    violations.forEach(violation => {
      try {
        switch (violation.id) {
          case 'image-alt':
            // Add missing alt text
            document.querySelectorAll('img:not([alt])').forEach(img => {
              (img as HTMLImageElement).alt = 'Image';
            });
            break;

          case 'button-name':
            // Add missing button labels
            document.querySelectorAll('button:empty').forEach(button => {
              button.textContent = 'Button';
            });
            break;

          case 'color-contrast':
            // Add high contrast class
            if (violation.element) {
              const element = document.querySelector(violation.element);
              element?.classList.add('high-contrast');
            }
            break;
        }
      } catch (error) {
        console.warn('Failed to apply automatic fix:', error);
      }
    });
  };

  return {
    violations,
    loading,
    error,
    runAudit,
    clearViolations: () => setViolations([])
  };
}