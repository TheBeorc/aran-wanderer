import { useQuery } from "@tanstack/react-query";

export type IconType =
  | "holy_well"
  | "church_monastic"
  | "fort_dun"
  | "castle_ruin"
  | "beach_strand"
  | "cliff_coast"
  | "village_settlement"
  | "pub_amenity"
  | "natural_feature"
  | "airport";

export type CoordPrecision = "precise" | "zona" | "uncertain";

export type Island = "Inishmore" | "Inishmaan" | "Inisheer";
export type Region = Island | "Connemara" | "Galway" | "Dublin" | "Mainland";

export interface PoiImage {
  url: string;
  author: string;
  license: string;
  source: string;
}

export interface Poi {
  name: string;
  island?: Island;
  region?: Region | string;

  cluster: string;
  lat: number;
  long: number;
  coord_precision: CoordPrecision;
  description: string;
  folklore?: string;
  nature?: string;
  icon_type: IconType;
  images: PoiImage[];
  main?: boolean;
}

export const KNOWN_ICON_TYPES: IconType[] = [
  "holy_well",
  "church_monastic",
  "fort_dun",
  "castle_ruin",
  "beach_strand",
  "cliff_coast",
  "village_settlement",
  "pub_amenity",
  "natural_feature",
  "airport",
];

export function repairEncoding<T>(str: T): T {
  if (typeof str !== "string" || !str) return str;
  let out = str as string;
  for (let i = 0; i < 4; i++) {
    if (!/[ÃÂ]/.test(out)) break;
    try {
      const bytes = Uint8Array.from(out, (c) => c.charCodeAt(0) & 0xff);
      const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      if (decoded === out) break;
      out = decoded;
    } catch {
      break;
    }
  }
  return out as unknown as T;
}

export function normalisePoi(raw: unknown): Poi | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.name !== "string" ||
    typeof r.lat !== "number" ||
    typeof r.long !== "number"
  ) {
    return null;
  }
  const icon = KNOWN_ICON_TYPES.includes(r.icon_type as IconType)
    ? (r.icon_type as IconType)
    : "natural_feature";
  const precision: CoordPrecision =
    r.coord_precision === "precise" ||
    r.coord_precision === "zona" ||
    r.coord_precision === "uncertain"
      ? r.coord_precision
      : "uncertain";
  return {
    name: repairEncoding(r.name),
    island: r.island as Island | undefined,
    region: repairEncoding((r.region as string | undefined) ?? undefined),

    cluster: repairEncoding((r.cluster as string) ?? ""),
    lat: r.lat,
    long: r.long,
    coord_precision: precision,
    description: repairEncoding((r.description as string) ?? ""),
    folklore: repairEncoding((r.folklore as string) ?? ""),
    nature: repairEncoding((r.nature as string) ?? ""),
    icon_type: icon,
    images: Array.isArray(r.images) ? (r.images as PoiImage[]) : [],
    main: r.main === true,
  };
}

export function usePois() {
  return useQuery({
    queryKey: ["pois"],
    queryFn: async (): Promise<Poi[]> => {
      const res = await fetch("/poi.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("Failed to load poi.json");
      const raw = (await res.json()) as unknown[];
      return raw.map(normalisePoi).filter((p): p is Poi => p !== null);
    },
    staleTime: 5 * 60 * 1000,
  });
}
