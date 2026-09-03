declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID =
  import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"] ?? "G-ZC5JGQVMSK";

let initialized = false;

export function initAnalytics() {
  if (typeof window === "undefined" || !MEASUREMENT_ID || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  // Must push the `arguments` object (not an array) — GA ignores plain arrays.
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag as unknown as (...args: unknown[]) => void;

  window.gtag("js", new Date());
  // We send page_view manually on every route change, so disable the automatic one.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path, page_location: window.location.href });
}
