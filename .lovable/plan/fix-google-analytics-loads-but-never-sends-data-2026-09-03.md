# Fix: Google Analytics loads but never sends data

## What I found

I loaded your published site in a real browser and watched the network:

- The GA script (`gtag/js?id=G-ZC5JGQVMSK`) does load — the tag is installed correctly.
- `window.gtag` exists and `dataLayer` has entries.
- **No measurement hit is ever sent** to Google (no `/g/collect` request). So GA receives zero traffic, which is why your reports show no visitors.

## The cause

In `src/lib/analytics.ts` the gtag shim pushes a real JavaScript **array** into `dataLayer`:

```ts
function gtag(...args: unknown[]) {
  window.dataLayer.push(args);   // array
}
```

Google's official snippet pushes the `arguments` object, not an array. GA's tag treats plain arrays as a different (GTM-style) message shape and silently ignores them, so `gtag('js', ...)` and `gtag('config', 'G-ZC5JGQVMSK')` never turn into a real page-view hit.

## The fix

1. Rewrite the shim in `src/lib/analytics.ts` to use the exact official form:
   `function gtag(){ window.dataLayer.push(arguments); }`
   (typed with a `Function`-style declaration so TypeScript is happy).
2. Keep the rest as-is: one-time init, `config` on load, and a `page_view` event on TanStack route changes.
3. Guard against double-init if `initAnalytics()` runs twice (React strict/dev remounts), so hits aren't duplicated.
4. Verify in a real browser that a request to `google-analytics.com/g/collect` fires on load and again on navigation to `/jury`.

## Notes

- The Measurement ID stays `G-ZC5JGQVMSK`; no connector env var is set, so the code falls back to that ID — correct.
- After deploying, GA Realtime should show your visit within ~30 seconds. Historical data before the fix cannot be recovered.
- Ad blockers still block GA for some visitors; that's normal and unrelated.
