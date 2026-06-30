# Fix POI card images not loading

## What I checked

- Image URLs in `poi.json` resolve correctly (e.g. `https://upload.wikimedia.org/.../County_Galway_-_Cuan_Chill_%C3%89inne_-_20130916111102.jpg` returns the real image when fetched from the preview).
- `repairEncoding` is **not** applied to image URLs, so they're not being mangled.
- No global CSS filter touches `<img>` outside the leaflet tile layer.
- In the dev preview, the service worker is disabled, so the user is almost certainly seeing the failure on the **published** site where the PWA service worker is active.

## Most likely causes

1. **Referer-based hotlink blocking.** `upload.wikimedia.org` occasionally rejects cross-origin `<img>` requests whose `Referer` looks unusual (PWA standalone, lovable preview origin, etc.). The standard fix is `referrerPolicy="no-referrer"`.
2. **Stale/broken Workbox cache.** The current rule caches any `request.destination === "image"` with `StaleWhileRevalidate` and `cacheableResponse: { statuses: [0, 200] }`. If an early load failed (network blip, opaque error), nothing is cached and subsequent loads still go through the SW fetch handler — which can surface as a hard image error if the network call fails. There is no dedicated rule for `upload.wikimedia.org`.
3. **No error UX.** When an image fails, `PoiSheet` currently shows the broken-image icon with no fallback, so the user sees "nothing loads".

## Changes

### 1. `src/components/poi/PoiSheet.tsx`
- Add `referrerPolicy="no-referrer"` and `crossOrigin="anonymous"` to the `<img>` in the carousel. (`no-referrer` is the canonical hotlink-friendly setting for Wikimedia Commons.)
- Track per-image error state. On `onError`, replace the broken `<img>` with the same parchment fallback already used when there are no images, and keep the figcaption attribution visible. If the carousel has multiple images, advance to the next non-broken one automatically.

### 2. `vite.config.ts` (Workbox runtimeCaching)
- Add a dedicated rule for Wikimedia hosts BEFORE the generic image rule:
  - `urlPattern: ({ url }) => /\.wikimedia\.org$/.test(url.hostname)`
  - `handler: "StaleWhileRevalidate"`, `cacheName: "aran-wikimedia"`
  - `expiration: { maxEntries: 300, maxAgeSeconds: 60*60*24*30 }`
  - `cacheableResponse: { statuses: [0, 200] }`
  - `fetchOptions: { mode: "no-cors", credentials: "omit", referrerPolicy: "no-referrer" }`
- Keep the existing generic image rule as a fallback for non-Wikimedia hosts.

### 3. Verify
- Run `bun run build` to confirm the PWA generator accepts the new rule.
- In preview, open a POI card and confirm:
  - `<img>` has `referrerpolicy="no-referrer"`.
  - Image loads with `naturalWidth > 0`.
  - Forcing an `onError` (e.g. via DevTools URL rewrite) shows the parchment fallback instead of the broken-image glyph.

## Out of scope

- Migrating Wikimedia images to a self-hosted/CDN copy. That's a bigger data step; flag for later if the referrer fix is not enough.
- Changing the attribution text format.
