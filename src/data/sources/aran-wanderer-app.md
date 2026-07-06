# The Aran Wanderer — App Documentation

## What it is
The Aran Wanderer is an interactive, illustrated field guide to the three
Aran Islands off the west coast of Ireland — **Inishmore (Inis Mór)**,
**Inishmaan (Inis Meáin)** and **Inisheer (Inis Oírr)**. It pairs a
geographically accurate map with a hand-drawn, cartoon "field-guide"
aesthetic so travellers can wander the islands, tap markers, and read
short entries mixing practical description, folklore and nature notes.

The app is a Progressive Web App (installable, works offline for already
visited tiles) built with **TanStack Start (React 19 + Vite)** and
deployed on Lovable Cloud. It has no user accounts — all state lives in
the browser.

## Who it's for
- Independent travellers planning or actively walking/cycling the Aran Islands.
- Curious readers who want the stories behind ruined churches, ring forts,
  holy wells and cliffs — not just their GPS coordinates.
- AI agents (via the built-in MCP server) that need structured access to
  the same POI dataset.

## Core experience
1. The homepage opens straight into a full-screen Leaflet map centred on
   the Aran archipelago.
2. **Cartoon markers** are placed at each Point of Interest (POI). Each
   marker's icon reflects its type: holy well, monastic church, stone
   fort (dún), castle ruin, beach/strand, cliff/coast, village
   settlement, pub, natural feature, airport.
3. Tapping a marker opens a **POI sheet** with:
   - Name, island, cluster (local grouping).
   - Description — what the place is and why it matters.
   - Folklore — local stories, saints' legends, place-name origins.
   - Nature — geology, flora/fauna notes where relevant.
   - Photographs with author / licence / source credits.
   - Coordinates and a `coord_precision` flag
     (`precise` | `zona` | `uncertain`) so users know how much to trust
     the pin.
4. **Routes layer** — curated walking/cycling routes are drawn on the
   map. Users can also **import their own** Google My Maps exports
   (KML / KMZ) via the map toolbar; imported routes are stored in
   `localStorage`, can be exported back out as JSON, or cleared.
5. A **floating "Deep dive" button** (bottom-right) opens a companion
   **NotebookLM** notebook in a new tab for long-form, source-grounded
   Q&A about the islands.

## Data model
POIs live in `public/poi.json` and are loaded client-side via TanStack
Query (`usePois`). Each POI has:

- `name`, `island` (`Inishmore` | `Inishmaan` | `Inisheer`), optional
  `region` for mainland-adjacent entries.
- `cluster` — a short human label grouping nearby POIs.
- `lat`, `long`, `coord_precision`.
- `description`, `folklore`, `nature` — free text.
- `icon_type` — one of the known types listed above.
- `images[]` — each `{ url, author, license, source }`.
- `main` — boolean, marks headline POIs.

Curated routes live under `src/lib/routes.ts` and are drawn as GeoJSON
line features. User-imported routes follow the same shape.

## Agent integrations (MCP)
The app exposes a **Model Context Protocol** server at `/mcp` so agents
(Claude, ChatGPT, Cursor, etc.) can query the field guide directly.
Three read-only tools are advertised:

- `list_pois` — browse POIs, optionally filtered by `island` or
  `icon_type`, with an optional `limit`.
- `search_pois` — full-text search across name, cluster, description,
  folklore and nature notes.
- `get_poi` — fetch the full entry for a POI by exact or substring name
  match.

No authentication is required; the POI dataset is public.

## Tech stack (short)
- **Frontend:** React 19, TanStack Start / Router, TanStack Query,
  Tailwind CSS v4, shadcn/ui, Leaflet + react-leaflet + markercluster.
- **PWA:** vite-plugin-pwa, custom manifest and icons.
- **Backend:** Lovable Cloud (Supabase) — currently used for the
  optional `chat` edge function and MCP infrastructure. No user auth.
- **MCP:** `@lovable.dev/mcp-js`, tools defined in `src/lib/mcp/`.

## What the app is *not*
- Not a booking or ticketing platform.
- Not a turn-by-turn navigation app — it shows where things are, not how
  to drive there.
- Not a social network — no accounts, no comments, no user profiles.
- Not exhaustive — it is a curated field guide, biased toward places
  with a story worth telling.
