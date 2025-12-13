'use client';

import { useWebVitals } from '@/lib/monitoring';
import { useErrorTracking } from '@/lib/errorTracking';

/**
 * Monitoring component that tracks Web Vitals and errors
 * Should be placed in the root layout
 */
export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useWebVitals();
  useErrorTracking();

  return <>{children}</>;
}
