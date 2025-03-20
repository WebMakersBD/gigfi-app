import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: "YOUR_SENTRY_DSN", // Replace with your Sentry DSN
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1,
      environment: "production"
    });
  }
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  console.error(error);
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context
    });
  }
};