Add Google Analytics to Delulu Bench

Goal: Track page views across the TanStack routes in the Delulu Bench app using the Google Analytics connector.

Plan
1. Inspect the current route setup and root entry point to decide where to inject the `gtag.js` script and route-change tracking hook.
2. Link the Google Analytics connector to the project so the GA4 Measurement ID is available as `VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY`.
3. Add a small analytics module (`src/lib/analytics.ts`) that initializes `gtag.js` once from the connector env var and exposes a `page_view` helper.
4. Wire up route-change tracking in `src/routes/__root.tsx` so every client-side navigation fires a `page_view` event.
5. Run the build to verify the env var usage and tracking code compile correctly.

Important note: the Google Analytics tracking code needs the **Measurement ID** (looks like `G-XXXXXXXXXX`), which is different from the numeric **Property ID** (`549053513`). Please provide the GA4 Measurement ID for the "Delulu Bench" property so the connector can be configured.
