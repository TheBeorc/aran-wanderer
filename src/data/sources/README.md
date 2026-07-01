# Aran Wanderer — Source Documents

Add plain-text or Markdown files here. Their full contents are bundled into the
system prompt for the `chat` Supabase Edge Function so the AI can answer using
them and cite them by filename.

**Important — Supabase Edge Function bundling:**
Supabase only bundles files that live under `supabase/functions/<name>/`. The
`chat` function therefore reads its sources from
`supabase/functions/chat/sources/`. Keep this folder (`src/data/sources/`) as
the canonical editing location and mirror any files into
`supabase/functions/chat/sources/` so the deployed function can see them.
