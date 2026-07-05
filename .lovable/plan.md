## Goal
Replace the in-app chat widget with a floating button that opens the public NotebookLM notebook in a new tab.

## Changes

**1. New component `src/components/notebook/NotebookLink.tsx`**
- Floating anchor (`<a>`) fixed bottom-right, matching the current button's position/z-index so it doesn't clash with the map controls.
- `href="https://notebooklm.google.com/notebook/4c246e41-578b-49fc-9f7c-d1324c6439f3"`, `target="_blank"`, `rel="noopener noreferrer"`.
- `aria-label="Open the Aran deep dive on NotebookLM"`.
- Styling: same warm/sea-deep palette as before (rounded pill, shadow, hover lift) to stay on-brand with the cartoon field-guide aesthetic. Slightly wider than the old circular button so it can hold an icon + short label ("Deep dive").
- Icon treatment: use lucide-react `BookOpen` (the open-notebook metaphor) with a small `Link2` (chain) badge overlaid in the top-right corner to signal "external link / URL". Both icons already available in lucide-react — no new deps.
- On small screens: collapse to icon-only circle; on `sm:` and up show icon + "Deep dive" label.

**2. `src/routes/index.tsx`**
- Remove `import { ChatPanel } from "@/components/chat/ChatPanel"` and the `<ChatPanel />` render.
- Import and render `<NotebookLink />` in the same spot.

**3. Cleanup**
- Delete `src/components/chat/ChatPanel.tsx` (no longer referenced).
- Leave the `chat` edge function and `ANTHROPIC_API_KEY` in place (out of scope; can be removed later if you want).

## Out of scope
- No changes to the edge function, sources folder, or backend config.
- No analytics/tracking on the outbound link.

## Visual reference (button)
```
┌──────────────────────┐
│  📖⛓  Deep dive      │   ← sea-deep bg, parchment text, rounded-full, shadow
└──────────────────────┘
```
Chain badge sits on the top-right of the open-book icon, mirroring the "external URL" convention.
