import { supabase } from './supabase';
import { metricsCollector } from './monitoring/metricsCollector';
import { errorMonitor } from './monitoring/errorMonitor';
import type { ErrorLog, SuccessLog, ErrorMetrics } from './monitoring/types';

// Re-export everything from the monitoring system
export { metricsCollector, errorMonitor };
export type { ErrorLog, SuccessLog, ErrorMetrics };