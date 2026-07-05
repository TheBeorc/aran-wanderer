import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { usePois, type Poi } from "@/lib/poi";
import { useRoutes, parseMyMapsFile, type RouteFeature } from "@/lib/routes";
import { PoiSheet } from "@/components/poi/PoiSheet";
import { NotebookLink } from "@/components/notebook/NotebookLink";

const AranMap = lazy(() => import("@/components/map/AranMap"));

const IMPORTED_ROUTES_KEY = "aran-wanderer:imported-routes:v1";

function loadImportedRoutes(): RouteFeature[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(IMPORTED_ROUTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RouteFeature[]) : [];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Aran Wanderer — interactive field guide" },
      {
        name: "description",
        content:
          "A playful illustrated field guide to the Aran Islands. Tap cartoon markers on a precise map to discover holy wells, stone forts, beaches and stories.",
      },
      { name: "theme-color", content: "#5fb0c9" },
      { property: "og:title", content: "The Aran Wanderer" },
      {
        property: "og:description",
        content:
          "Walk the Aran Islands with a cartoon field guide on a geographically accurate map.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: pois, isLoading, error } = usePois();
  const { data: baseRoutes } = useRoutes();
  const [importedRoutes, setImportedRoutes] = useState<RouteFeature[]>([]);
  const [selected, setSelected] = useState<Poi | null>(null);

  // Hydrate from localStorage after mount (SSR-safe).
  useEffect(() => {
    setImportedRoutes(loadImportedRoutes());
  }, []);

  const allRoutes: RouteFeature[] = [...(baseRoutes ?? []), ...importedRoutes];

  const handleImportRoutes = useCallback(async (file: File) => {
    const features = await parseMyMapsFile(file);
    setImportedRoutes((prev) => {
      const next = [...prev, ...features];
      try {
        window.localStorage.setItem(IMPORTED_ROUTES_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  const handleClearImported = useCallback(() => {
    setImportedRoutes([]);
    try {
      window.localStorage.removeItem(IMPORTED_ROUTES_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleExportImported = useCallback(() => {
    const blob = new Blob([JSON.stringify(importedRoutes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "imported-routes.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [importedRoutes]);


  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--color-sea)]">
      {isLoading && (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <p className="text-sm">Loading the islands…</p>
        </div>
      )}
      {error && (
        <div className="flex h-full w-full items-center justify-center p-6 text-center">
          <p className="text-sm text-destructive">
            Couldn't load the field guide. Try refreshing the page.
          </p>
        </div>
      )}
      {pois && (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <p className="text-sm">Unfolding the map…</p>
            </div>
          }
        >
          <AranMap
            pois={pois}
            selected={selected}
            onSelect={setSelected}
            routes={allRoutes}
            importedCount={importedRoutes.length}
            onImportRoutes={handleImportRoutes}
            onClearImported={handleClearImported}
            onExportImported={handleExportImported}

          />
        </Suspense>
      )}
      <PoiSheet poi={selected} onClose={() => setSelected(null)} />
      <NotebookLink />
    </main>
  );
}
