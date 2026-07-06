import { defineMcp } from "@lovable.dev/mcp-js";
import getPoiTool from "./tools/get-poi";
import listPoisTool from "./tools/list-pois";
import searchPoisTool from "./tools/search-pois";

export default defineMcp({
  name: "aran-wanderer-mcp",
  title: "Aran Wanderer",
  version: "0.1.0",
  instructions:
    "Tools for the Aran Wanderer illustrated field guide to the Aran Islands (Inishmore, Inishmaan, Inisheer). Use `list_pois` to browse points of interest (optionally filtered by island or icon type), `search_pois` for full-text search across names, folklore and nature notes, and `get_poi` to fetch the full entry for a specific place.",
  tools: [listPoisTool, searchPoisTool, getPoiTool],
});
