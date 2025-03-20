import { onCLS, onFID, onLCP, onTTFB, type Metric } from 'web-vitals';
import { captureError } from './sentry';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

interface VitalsOptions {
  params: Record<string, string>;
  path: string;
  analyticsId: string;
}

function getConnectionSpeed(): string {
  return 'connection' in navigator &&
    'effectiveType' in (navigator as any).connection
    ? (navigator as any).connection.effectiveType
    : '';
}

function sendToAnalytics(metric: Metric, options: VitalsOptions): void {
  const page = Object.entries(options.params).reduce(
    (acc, [key, value]) => acc.replace(value, `[${key}]`),
    options.path
  );

  const body = {
    dsn: options.analyticsId,
    id: metric.id,
    page,
    href: location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  };

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(vitalsUrl, JSON.stringify(body));
    } else {
      fetch(vitalsUrl, {
        body: JSON.stringify(body),
        method: 'POST',
        keepalive: true,
      });
    }
  } catch (error) {
    captureError(error as Error);
  }
}

export function webVitals(options: VitalsOptions): void {
  try {
    onFID((metric) => sendToAnalytics(metric, options));
    onTTFB((metric) => sendToAnalytics(metric, options));
    onLCP((metric) => sendToAnalytics(metric, options));
    onCLS((metric) => sendToAnalytics(metric, options));
  } catch (err) {
    captureError(err as Error);
  }
}