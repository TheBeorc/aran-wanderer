import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadPois } from "../pois";

export default defineTool({
  name: "list_pois",
  title: "List points of interest",
  description:
    "List points of interest from the Aran Wanderer field guide. Optionally filter by island (Inishmore, Inishmaan, Inisheer) or icon type (e.g. holy_well, fort_dun, beach_strand).",
  inputSchema: {
    island: z
      .enum(["Inishmore", "Inishmaan", "Inisheer"])
      .optional()
      .describe("Restrict results to a single Aran island."),
    icon_type: z
      .string()
      .optional()
      .describe("Restrict to an icon type such as holy_well, fort_dun, beach_strand, church_monastic, cliff_coast, village_settlement, pub_amenity, natural_feature, airport, castle_ruin."),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max number of results to return. Defaults to all matches."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ island, icon_type, limit }) => {
    let items = loadPois();
    if (island) items = items.filter((p) => p.island === island);
    if (icon_type) items = items.filter((p) => p.icon_type === icon_type);
    if (limit) items = items.slice(0, limit);
    const rows = items.map((p) => ({
      name: p.name,
      island: p.island ?? p.region ?? null,
      cluster: p.cluster,
      icon_type: p.icon_type,
      lat: p.lat,
      long: p.long,
    }));
    return {
      content: [{ type: "text", text: `Found ${rows.length} POI(s).\n${JSON.stringify(rows, null, 2)}` }],
      structuredContent: { count: rows.length, pois: rows },
    };
  },
});
