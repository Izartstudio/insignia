type AnalyticsValue = string | number | boolean | undefined;
export type AnalyticsParameters = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    insigniaAnalyticsId?: string;
  }
}

/** Never include names, email addresses, search strings or complete external URLs. */
export function trackEvent(name: string, parameters: AnalyticsParameters = {}) {
  if (typeof window === 'undefined' || !window.insigniaAnalyticsId) return;
  window.gtag?.('event', name, { ...parameters, send_to: window.insigniaAnalyticsId });
}
