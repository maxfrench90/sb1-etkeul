import React, { createContext, useContext, useEffect } from 'react';
import { accessibilityMonitor } from '../../lib/accessibility';
import { Toast } from '../ui/Toast';
import { errorMonitor } from '../../lib/monitoring';

interface AccessibilityContextType {
  runAudit: () => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [violations, setViolations] = React.useState<any[]>([]);
  const [showToast, setShowToast] = React.useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      checkAccessibility();
    }
  }, []);

  const checkAccessibility = async () => {
    try {
      const results = await accessibilityMonitor.runAudit();
      setViolations(results);
      
      if (results.length > 0) {
        setShowToast(true);
      }
    } catch (error) {
      await errorMonitor.logError({
        operation: 'accessibility.check',
        error: error instanceof Error ? error.message : 'Accessibility check failed',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <AccessibilityContext.Provider value={{ runAudit: checkAccessibility }}>
      {children}
      {showToast && (
        <Toast
          type="warning"
          message="Accessibility issues detected. Check console for details."
          onClose={() => setShowToast(false)}
        />
      )}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}