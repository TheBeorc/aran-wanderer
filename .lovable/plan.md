
# The Aran Wanderer — Build Plan

A mobile-first, installable PWA that renders Aran Islands POIs on a geographically accurate but cartoon-styled Leaflet map, with live GPS, precision-aware markers, and an illustrated field-guide feel.

## 1. Stack & setup

- TanStack Start (project default) + React 19 + Vite 7 + Tailwind v4 (already wired).
- Add deps: `leaflet`, `react-leaflet`, `leaflet.markercluster`, `@types/leaflet`, `@types/leaflet.markercluster`.
- PWA via `vite-plugin-pwa` (per project PWA skill: guarded registration wrapper, no SW in Lovable preview/dev, `?sw=off` kill switch, `NetworkFirst` for navigations).
- Single page: replace placeholder `src/routes/index.tsx` with the map experience. Map component is client-only (dynamic import, no SSR — Leaflet touches `window`).

## 2. Data layer

- `public/poi.json` shipped with a small mock sample (~6–10 POIs across the three islands, mixing `precise`/`zona`, with and without images) matching the exact schema in the brief.
- `src/lib/poi.ts`: TypeScript types (`Poi`, `IconType`, `CoordPrecision`, `PoiImage`), a Zod-light runtime guard, and a `useQuery` loader fetching `/poi.json` once.
- All rendering is client-side from in-memory POIs. No backend, no Sheets.

## 3. Map

- `<MapContainer>` with:
  - `maxBounds=[[53.04,-9.82],[53.16,-9.48]]`, `maxBoundsViscosity: 1`.
  - `minZoom` chosen so the whole archipelago fits on a 380px screen (~11), `maxZoom: 18`.
  - Initial view fits all three islands.
- Base tiles: CARTO **Voyager** (free, no key, friendly palette, exact Web Mercator). Attribution kept visible. If at runtime the tiles 401/forbid, fall back to OSM standard — same projection.
- Cartoon skin: CSS filter on the tile pane (`saturate(1.15) contrast(0.95) hue-rotate(-4deg) brightness(1.03)`) plus a warm parchment/sea background behind the map. No marker distortion — filters apply only to `.leaflet-tile-pane`.

## 4. GPS

- `navigator.geolocation.watchPosition` started on mount; cleared on unmount.
- "You are here": pulsing dot `divIcon` + translucent accuracy `<Circle>` with radius = reported accuracy (meters).
- Floating bottom-right **Recenter** button (FAB). Camera recenters only on first fix and on button tap — never auto-snaps after.
- Permission denied / unsupported / error → small dismissible toast/banner. Map remains fully usable.

## 5. Markers, icons, precision

- 9 cohesive cartoon SVG icons (single illustrated style) authored as inline SVG components in `src/components/icons/poi/`: `holy_well`, `church_monastic`, `fort_dun`, `castle_ruin`, `beach_strand`, `cliff_coast`, `village_settlement`, `pub_amenity`, `natural_feature`.
- Single editable map in `src/lib/poi-icons.ts`:
  ```ts
  export const POI_ICONS: Record<IconType, IconSpec> = { ... }
  ```
  Unknown/missing `icon_type` → `natural_feature` (no crash).
- Each marker is a Leaflet `divIcon` wrapping the SVG so we can style precision states with CSS:
  - `precise` → full opacity, crisp drop-shadow.
  - `zona` / `uncertain` → ~60% opacity + soft radial halo ring behind icon.
- Clustering via `leaflet.markercluster`: enabled only at far zoom (`disableClusteringAtZoom: 15`, `maxClusterRadius` tuned ~50px). Cluster bubble restyled with a cartoon `iconCreateFunction` (warm circle, hand-drawn border, count in display font).

## 6. POI detail card

- Custom bottom sheet (no shadcn drawer needed — keep light): fixed full-width on mobile, slides up, swipe-down + X to dismiss, focus-trapped, ESC closes. On `md+` it becomes a right-side panel.
- Contents:
  - Name (Irish + English exactly as provided).
  - Small category icon + island name + precision note ("Approximate location.") when `zona`/`uncertain`.
  - Description.
  - **Folklore** and **Nature** as labelled secondary sections only when non-empty.
  - Swipeable image carousel (simple CSS scroll-snap, dot indicators). Under every image: `© {author} — {license} (via {source})`. Never render an image without attribution. Empty `images[]` → illustrated placeholder card.
- On open: map `flyTo` the marker with a vertical offset so the marker sits in the visible map area above the sheet.

## 7. Mobile-first + PWA

- Layout: full-bleed map, top-left title chip ("The Aran Wanderer"), bottom-right Recenter FAB, bottom-left optional islands legend toggle. Designed at 380px first; tap targets ≥44px.
- PWA (via the project PWA skill, offline path since the user requested offline shell + data):
  - `vite-plugin-pwa` `generateSW`, `registerType: 'autoUpdate'`, `injectRegister: null`.
  - Guarded registration wrapper (refuses in dev, iframe, Lovable preview hostnames, `?sw=off`).
  - Precache app shell + `/poi.json`.
  - Runtime caching: `NetworkFirst` for navigations; `CacheFirst` for hashed assets; `StaleWhileRevalidate` for tile requests with a capped `expiration` (best-effort offline tiles).
  - Honest TODO comment: tile caching only covers tiles the user has already viewed; true offline coverage of all Aran tiles is out of scope here.
- Manifest + maskable icon + apple-touch-icon + theme color.

## 8. Acceptance check before shipping

Walk through each of the 6 acceptance criteria against the running app:
1. Spot-check a known lat/long marker at zoom 12/15/18.
2. Try to pan to Galway — bounded.
3. Grant + deny geolocation paths.
4. Tap a POI with images and one without — verify attribution lines.
5. Compare a `precise` vs `zona` marker visually.
6. Install to home screen from a phone-sized viewport and confirm cold load works against cached shell + `poi.json`.

## 9. Handover notes (added to README + an in-app "About" line)

- **Swap real data**: replace `public/poi.json` with your file (same schema). No rebuild step beyond a normal deploy; PWA auto-updates on next visit.
- **Swap icons**: edit `src/lib/poi-icons.ts` — one entry per `icon_type`, pointing at any React SVG component in `src/components/icons/poi/`. Add new categories by extending the `IconType` union and the map; unknown types continue to fall back to `natural_feature`.

---

## Technical details

- File layout
  - `src/routes/index.tsx` — route shell, dynamic-imports the map (SSR-safe).
  - `src/components/map/AranMap.tsx` — `MapContainer`, tile layer, bounds, GPS layer, marker cluster group.
  - `src/components/map/UserLocation.tsx` — `watchPosition` hook + pulsing dot + accuracy circle.
  - `src/components/map/PoiMarkers.tsx` — builds `divIcon` markers from POIs + cluster.
  - `src/components/poi/PoiSheet.tsx` — bottom sheet / side panel.
  - `src/components/poi/ImageCarousel.tsx` — scroll-snap carousel with mandatory attribution.
  - `src/components/icons/poi/*.tsx` — 9 SVG icon components.
  - `src/lib/poi.ts` — types + loader hook.
  - `src/lib/poi-icons.ts` — editable icon registry.
  - `src/lib/geolocation.ts` — `useWatchPosition` hook.
  - `src/pwa/register.ts` — guarded SW registration per PWA skill.
  - `public/poi.json`, `public/manifest.webmanifest`, `public/icons/*`.
- SSR safety: map module is loaded with `React.lazy` + `<Suspense>` inside a `typeof window !== 'undefined'` guard so TanStack Start prerender doesn't touch Leaflet.
- Leaflet CSS + markercluster CSS imported once in the map module; default marker icon URL fix applied.
- No hardcoded colors in components — add semantic tokens (`--color-sea`, `--color-land`, `--color-parchment`, `--color-marker-precise`, `--color-marker-approx`) to `src/styles.css` and use Tailwind utilities bound to them.
- No Lovable Cloud needed (no auth, no DB, no server functions).
