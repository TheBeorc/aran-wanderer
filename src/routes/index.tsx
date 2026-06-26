import { lazy, Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { usePois, type Poi } from "@/lib/poi";
import { PoiSheet } from "@/components/poi/PoiSheet";

const AranMap = lazy(() => import("@/components/map/AranMap"));

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
  const [selected, setSelected] = useState<Poi | null>(null);

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
          <AranMap pois={pois} selected={selected} onSelect={setSelected} />
        </Suspense>
      )}
      <PoiSheet poi={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
