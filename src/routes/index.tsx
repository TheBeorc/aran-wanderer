import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { usePois, type Poi } from "@/lib/poi";
import { useRoutes, parseMyMapsFile, type RouteFeature } from "@/lib/routes";
import { PoiSheet } from "@/components/poi/PoiSheet";

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
...
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
            onImportRoutes={handleImportRoutes}
          />
        </Suspense>
      )}
      <PoiSheet poi={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
