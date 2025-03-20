import { captureError } from './sentry';

interface PerformanceMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  try {
    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const fcp = entries[0];
        reportPerformanceMetric('FCP', fcp.startTime);
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const lcp = entries[entries.length - 1];
        reportPerformanceMetric('LCP', lcp.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-input') {
          reportPerformanceMetric('FID', entry.processingStart - entry.startTime);
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          reportPerformanceMetric('CLS', clsValue);
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });

  } catch (error) {
    captureError(error as Error);
  }
}

// Report metrics to analytics
function reportPerformanceMetric(metric: string, value: number) {
  if (import.meta.env.PROD) {
    // Send to analytics service
    const data = {
      metric,
      value,
      timestamp: Date.now(),
      page: window.location.pathname,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', JSON.stringify(data));
    } else {
      fetch('/api/metrics', {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true
      }).catch(error => captureError(error));
    }
  }
}