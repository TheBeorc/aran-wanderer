import { BookOpen, Link2 } from "lucide-react";

const NOTEBOOK_URL =
  "https://notebooklm.google.com/notebook/4c246e41-578b-49fc-9f7c-d1324c6439f3";

export function NotebookLink() {
  return (
    <a
      href={NOTEBOOK_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open the Aran deep dive on NotebookLM"
      className="fixed bottom-4 right-4 z-[1000] group inline-flex items-center gap-2 rounded-full bg-[var(--color-sea-deep)] px-3 py-3 text-[var(--color-parchment)] shadow-lg shadow-black/30 ring-2 ring-white/20 transition hover:-translate-y-0.5 hover:bg-[var(--color-sea-deep)]/90 focus:outline-none focus:ring-4 focus:ring-white/40 sm:pl-4 sm:pr-5"
    >
      <span className="relative flex h-8 w-8 items-center justify-center">
        <BookOpen className="h-6 w-6" strokeWidth={2.25} />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-parchment)] text-[var(--color-sea-deep)] shadow-sm ring-2 ring-[var(--color-sea-deep)]">
          <Link2 className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      </span>
      <span className="hidden text-sm font-semibold tracking-wide sm:inline">
        Deep dive
      </span>
    </a>
  );
}

export default NotebookLink;
