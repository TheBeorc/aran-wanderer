import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, LineString, Feature } from "geojson";
import { repairEncoding } from "@/lib/poi";

export type RouteMode = "car" | "walk";

export interface RouteProperties {
  name: string;
  mode: RouteMode;
  description?: string;
}

export type RouteFeature = Feature<LineString, RouteProperties>;

export const ROUTE_STYLE: Record<RouteMode, { color: string; dashArray?: string }> = {
  car: { color: "#b45309" }, // amber-700, solid
  walk: { color: "#15803d", dashArray: "2 8" }, // green-700, dotted
};

function coerceMode(input: unknown): RouteMode {
  const v = String(input ?? "").toLowerCase().trim();
  if (v === "walk" || v === "walking" || v === "foot" || v === "hike") return "walk";
  return "car";
}

export function normaliseRouteFeature(f: unknown): RouteFeature | null {
  if (!f || typeof f !== "object") return null;
  const feat = f as Feature;
  if (feat.type !== "Feature" || !feat.geometry) return null;
  const geom = feat.geometry;
  if (geom.type !== "LineString") return null;
  const coords = (geom as LineString).coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const props = (feat.properties ?? {}) as Record<string, unknown>;
  const name = repairEncoding(typeof props.name === "string" ? props.name : "Route");
  const description =
    typeof props.description === "string" ? repairEncoding(props.description) : undefined;
  const mode = coerceMode(props.mode);
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: { name, mode, description },
  };
}

export function normaliseRouteCollection(raw: unknown): RouteFeature[] {
  if (!raw || typeof raw !== "object") return [];
  const fc = raw as FeatureCollection;
  if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) return [];
  return fc.features
    .map(normaliseRouteFeature)
    .filter((f): f is RouteFeature => f !== null);
}

export function useRoutes() {
  return useQuery({
    queryKey: ["routes"],
    queryFn: async (): Promise<RouteFeature[]> => {
      const res = await fetch("/routes.json", { cache: "no-cache" });
      if (!res.ok) return [];
      const raw = (await res.json()) as unknown;
      return normaliseRouteCollection(raw);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Parse a Google My Maps KML/KMZ or GPX file into RouteFeatures.
 *  KML: each top-level <Folder> (layer) name is mapped to a mode.
 *  GPX: every <trk>/<rte> becomes a walk LineString; <wpt> ignored. */
export async function parseMyMapsFile(file: File): Promise<RouteFeature[]> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".gpx")) {
    const gpxText = await file.text();
    const gpxParser = new DOMParser();
    const gpxXml = gpxParser.parseFromString(gpxText, "text/xml");
    const { gpx: gpxToGeoJSON } = await import("@tmcw/togeojson");
    const gj = gpxToGeoJSON(gpxXml as unknown as Document);
    const out: RouteFeature[] = [];
    for (const feat of gj.features ?? []) {
      if (!feat.geometry) continue;
      const props = (feat.properties ?? {}) as Record<string, unknown>;
      const name = repairEncoding(
        typeof props.name === "string" ? props.name : "Imported route",
      );
      const description =
        typeof props.description === "string"
          ? repairEncoding(props.description)
          : undefined;
      if (feat.geometry.type === "LineString") {
        out.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: (feat.geometry as LineString).coordinates,
          },
          properties: { name, mode: "walk", description },
        });
      } else if (feat.geometry.type === "MultiLineString") {
        for (const line of (feat.geometry as { coordinates: number[][][] })
          .coordinates) {
          out.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: line },
            properties: { name, mode: "walk", description },
          });
        }
      }
      // Ignore Point (waypoint) features entirely.
    }
    return out;
  }

  let kmlText: string;
  if (lower.endsWith(".kmz")) {
    const JSZipMod = await import("jszip");
    const JSZip = JSZipMod.default ?? JSZipMod;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const kmlEntry = Object.values(zip.files).find((f) =>
      f.name.toLowerCase().endsWith(".kml"),
    );
    if (!kmlEntry) throw new Error("No .kml file inside .kmz");
    kmlText = await kmlEntry.async("string");
  } else {
    kmlText = await file.text();
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "text/xml");
  const { kml: kmlToGeoJSON } = await import("@tmcw/togeojson");

  const out: RouteFeature[] = [];
  const folders = Array.from(xml.getElementsByTagName("Folder"));

  const collectFromDoc = (doc: Document | Element, defaultMode: RouteMode) => {
    const gj = kmlToGeoJSON(doc as unknown as Document);
    for (const feat of gj.features ?? []) {
      if (!feat.geometry) continue;
      if (feat.geometry.type === "LineString") {
        const props = (feat.properties ?? {}) as Record<string, unknown>;
        const name = repairEncoding(
          typeof props.name === "string" ? props.name : "Imported route",
        );
        const description =
          typeof props.description === "string"
            ? repairEncoding(props.description)
            : undefined;
        out.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: (feat.geometry as LineString).coordinates,
          },
          properties: { name, mode: defaultMode, description },
        });
      } else if (feat.geometry.type === "MultiLineString") {
        const props = (feat.properties ?? {}) as Record<string, unknown>;
        const baseName = repairEncoding(
          typeof props.name === "string" ? props.name : "Imported route",
        );
        for (const line of (feat.geometry as { coordinates: number[][][] }).coordinates) {
          out.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: line },
            properties: { name: baseName, mode: defaultMode },
          });
        }
      }
    }
  };

  if (folders.length > 0) {
    for (const folder of folders) {
      const nameEl = Array.from(folder.children).find((c) => c.tagName === "name");
      const folderName = (nameEl?.textContent ?? "").toLowerCase().trim();
      const mode: RouteMode = folderName.includes("walk") ? "walk" : "car";
      // Wrap the folder in a synthetic kml doc so togeojson sees Placemarks.
      const wrapperDoc = parser.parseFromString(
        `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${folder.outerHTML}</Document></kml>`,
        "text/xml",
      );
      collectFromDoc(wrapperDoc, mode);
    }
  } else {
    collectFromDoc(xml, "car");
  }

  return out;
}
