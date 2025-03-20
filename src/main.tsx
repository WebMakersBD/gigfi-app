import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { initSentry } from './lib/sentry';
import { webVitals } from './lib/vitals';
import { initPerformanceMonitoring } from './lib/performance';
import { initializeThirdweb } from './lib/thirdweb';
import './index.css';

// Initialize monitoring and analytics
initSentry();
initPerformanceMonitoring();

// Initialize ThirdWeb
initializeThirdweb().catch(console.error);

if (import.meta.env.PROD) {
  webVitals({
    path: window.location.pathname,
    params: {},
    analyticsId: import.meta.env.VITE_ANALYTICS_ID,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  </StrictMode>
);