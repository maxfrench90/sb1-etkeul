// Core accessibility types
export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  element?: string;
  help?: string;
  helpUrl?: string;
}

export interface AuditConfig {
  rules?: string[];
  exclude?: string[];
  context?: Record<string, any>;
}

export interface AuditRequest {
  priority: number;
  config?: AuditConfig;
  onComplete?: (violations: AccessibilityViolation[]) => void;
}

export interface AuditResult {
  violations: AccessibilityViolation[];
  timestamp: string;
  duration: number;
}

export interface RateLimitConfig {
  limit: number;
  interval: number; // in milliseconds
}

export interface QueueItem {
  request: AuditRequest;
  resolve: (violations: AccessibilityViolation[]) => void;
  reject: (error: Error) => void;
}