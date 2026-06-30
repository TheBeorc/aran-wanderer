import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import type { Poi } from "@/lib/poi";
import { POI_LABELS, renderPoiIcon } from "@/lib/poi-icons";

export interface PoiSheetProps {
  poi: Poi | null;
  onClose: () => void;
}

export function PoiSheet({ poi, onClose }: PoiSheetProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    setImgIdx(0);
    setBrokenUrls(new Set());
  }, [poi]);

  useEffect(() => {
    if (!poi) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [poi, onClose]);

  if (!poi) return null;

  const approx = poi.coord_precision !== "precise";
  const images = poi.images ?? [];
  const visibleImages = images.filter((im) => !brokenUrls.has(im.url));
  const hasImages = visibleImages.length > 0;
  const cur = hasImages ? visibleImages[Math.min(imgIdx, visibleImages.length - 1)] : null;

  return (
    <>
      {/* Scrim - mobile only */}
      <div
        className="fixed inset-0 z-[1500] bg-black/30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={poi.name}
        className="fixed bottom-0 left-0 right-0 z-[1600] max-h-[80vh] overflow-y-auto rounded-t-3xl bg-card shadow-2xl ring-1 ring-border animate-in slide-in-from-bottom duration-300 md:bottom-4 md:left-auto md:right-4 md:top-4 md:max-h-[calc(100vh-2rem)] md:w-[400px] md:rounded-3xl"
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-2 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-start gap-3 px-5 pt-3 pb-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-parchment)] ring-1 ring-border">
            <div className="h-7 w-7">{renderPoiIcon(poi.icon_type)}</div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight text-foreground">{poi.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {POI_LABELS[poi.icon_type]} · {poi.region ?? poi.island}
            </p>
            {approx && (
              <p className="mt-1 text-[11px] font-medium text-[var(--color-marker-approx-ink)]">
                Approximate location.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Images */}
        <div className="px-5 pt-2">
          {hasImages && cur ? (
            <figure className="overflow-hidden rounded-2xl bg-muted">
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={cur.url}
                  alt={poi.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setBrokenUrls((prev) => {
                      if (prev.has(cur.url)) return prev;
                      const next = new Set(prev);
                      next.add(cur.url);
                      return next;
                    });
                    setImgIdx(0);
                  }}
                />
                {visibleImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx((i) => (i - 1 + visibleImages.length) % visibleImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-1.5 text-foreground shadow hover:bg-card"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setImgIdx((i) => (i + 1) % visibleImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-1.5 text-foreground shadow hover:bg-card"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                      {visibleImages.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${
                            i === imgIdx ? "bg-card" : "bg-card/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <figcaption className="px-3 py-2 text-[11px] leading-snug text-muted-foreground">
                © {cur.author} — {cur.license} (via {cur.source})
              </figcaption>
            </figure>
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-[var(--color-parchment)] ring-1 ring-border">
              <div className="h-14 w-14 opacity-50">{renderPoiIcon(poi.icon_type)}</div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-4 px-5 pb-8 pt-4">
          {poi.description && (
            <p className="text-sm leading-relaxed text-foreground">{poi.description}</p>
          )}
          {poi.folklore && poi.folklore.trim() !== "" && (
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-sea-deep)]">
                Folklore
              </h3>
              <p className="text-sm leading-relaxed text-foreground">{poi.folklore}</p>
            </section>
          )}
          {poi.nature && poi.nature.trim() !== "" && (
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-green-moss)]">
                Nature
              </h3>
              <p className="text-sm leading-relaxed text-foreground">{poi.nature}</p>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
