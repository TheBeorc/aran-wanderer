import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadPois } from "../pois";

export default defineTool({
  name: "search_pois",
  title: "Search points of interest",
  description:
    "Full-text search over Aran Islands POIs. Matches against name, cluster, description, folklore, and nature notes.",
  inputSchema: {
    query: z.string().min(1).describe("Search term to match against POI text fields."),
    limit: z.number().int().positive().optional().describe("Max results. Defaults to 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }) => {
    const q = query.toLowerCase();
    const items = loadPois().filter((p) => {
      const hay = [p.name, p.cluster, p.description, p.folklore, p.nature, p.region]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    const capped = items.slice(0, limit ?? 20);
    const rows = capped.map((p) => ({
      name: p.name,
      island: p.island ?? p.region ?? null,
      icon_type: p.icon_type,
      description: p.description,
    }));
    return {
      content: [
        {
          type: "text",
          text: `Matched ${items.length} POI(s) for "${query}" (showing ${rows.length}).\n${JSON.stringify(rows, null, 2)}`,
        },
      ],
      structuredContent: { total: items.length, results: rows },
    };
  },
});
