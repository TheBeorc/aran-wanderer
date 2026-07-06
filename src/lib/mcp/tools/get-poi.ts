import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadPois } from "../pois";

export default defineTool({
  name: "get_poi",
  title: "Get a point of interest",
  description:
    "Return the full field-guide entry for a POI by (case-insensitive) name match, including description, folklore, nature notes, coordinates, and image credits.",
  inputSchema: {
    name: z.string().min(1).describe("POI name or a distinctive substring of it."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ name }) => {
    const needle = name.toLowerCase();
    const pois = loadPois();
    const match =
      pois.find((p) => p.name.toLowerCase() === needle) ??
      pois.find((p) => p.name.toLowerCase().includes(needle));
    if (!match) {
      return {
        content: [{ type: "text", text: `No POI found matching "${name}".` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(match, null, 2) }],
      structuredContent: { poi: match },
    };
  },
});
