import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null, // wrapper module is the only registrar
        filename: "sw.js",
        devOptions: { enabled: false },
        manifest: false, // we ship public/manifest.webmanifest manually
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,json}"],
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/api\//, /^\/~oauth/],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // App navigations - always try network first
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "aran-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              // POI data
              urlPattern: ({ url }) => url.pathname === "/poi.json",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "aran-poi-data",
                expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              // CARTO basemap tiles - best-effort offline cache for visited tiles.
              // TODO: this only covers tiles the user has already viewed. True
              // offline coverage of the entire Aran archipelago would need a
              // pre-seeding step outside this build's scope.
              urlPattern: ({ url }) =>
                /^https:\/\/[abcd]\.basemaps\.cartocdn\.com\//.test(url.href),
              handler: "CacheFirst",
              options: {
                cacheName: "aran-tiles",
                expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // POI images (Wikimedia etc.)
              urlPattern: ({ request }) => request.destination === "image",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "aran-images",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
});
