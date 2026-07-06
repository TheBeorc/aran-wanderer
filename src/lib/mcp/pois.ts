// Server-side POI loader for MCP tools. Reads the bundled public/poi.json
// so tools work in the Worker runtime without hitting the network.
import poiJson from "../../../public/poi.json" with { type: "json" };
import { normalisePoi, type Poi } from "@/lib/poi";

let cache: Poi[] | null = null;

export function loadPois(): Poi[] {
  if (cache) return cache;
  const raw = poiJson as unknown[];
  cache = raw.map(normalisePoi).filter((p): p is Poi => p !== null);
  return cache;
}
