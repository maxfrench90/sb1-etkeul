import React, { useEffect, useRef } from 'react';
import { performance } from '../../lib/performance';
import { metricsCollector } from '../../lib/monitoring';

interface Props {
  componentName: string;
  children: React.ReactNode;
}

export function PerformanceMonitor({ componentName, children }: Props) {
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const mountTime = performance.now() - startTimeRef.current;

    // Track mount performance
    metricsCollector.recordEvent({
      type: 'performance',
      subtype: 'component_mount',
      success: true,
      duration: mountTime,
      metadata: {
        componentName
      }
    });

    return () => {
      const unmountStart = performance.now();
      const totalLifetime = unmountStart - startTimeRef.current;

      // Track unmount and total lifetime
      metricsCollector.recordEvent({
        type: 'performance',
        subtype: 'component_lifetime',
        success: true,
        duration: totalLifetime,
        metadata: {
          componentName,
          phase: 'unmount'
        }
      });
    };
  }, [componentName]);

  // Track significant updates
  useEffect(() => {
    const updateStart = performance.now();
    const updateDuration = updateStart - startTimeRef.current;

    if (updateDuration > 16.67) { // Longer than one frame (60fps)
      metricsCollector.recordEvent({
        type: 'performance',
        subtype: 'component_update',
        success: false,
        duration: updateDuration,
        metadata: {
          componentName,
          exceededFrameBudget: true
        }
      });
    }

    startTimeRef.current = updateStart;
  });

  return <>{children}</>;
}