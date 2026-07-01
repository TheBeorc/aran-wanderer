import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const CHAT_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "waiting" | "streaming">("idle");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || status !== "idle") return;

    const history = messages;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setStatus("waiting");

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstToken = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const dataLine = evt
            .split("\n")
            .find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            if (
              json.type === "content_block_delta" &&
              json.delta?.type === "text_delta" &&
              typeof json.delta.text === "string"
            ) {
              if (firstToken) {
                firstToken = false;
                setStatus("streaming");
              }
              const chunk: string = json.delta.text;
              setMessages((prev) => {
                const copy = prev.slice();
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") {
                  copy[copy.length - 1] = { ...last, content: last.content + chunk };
                }
                return copy;
              });
            } else if (json.type === "error") {
              throw new Error(json.error?.message ?? "Stream error");
            }
          } catch (err) {
            if (err instanceof SyntaxError) continue;
            throw err;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError("Couldn't reach the guide. Please try again in a moment.");
      // Drop the empty assistant placeholder on failure.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") return prev.slice(0, -1);
        return prev;
      });
      console.error("chat error", msg);
    } finally {
      setStatus("idle");
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask the guide"
          className="fixed bottom-4 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-sea-deep)] text-white shadow-lg shadow-black/30 transition hover:scale-105 hover:bg-[var(--color-sea-deep)]/90 focus:outline-none focus:ring-4 focus:ring-white/40"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-[1000] flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border-2 border-[var(--color-sea-deep)]/20 bg-[var(--color-parchment)] shadow-2xl shadow-black/30">
          {/* Header */}
          <header className="flex items-center justify-between gap-2 border-b border-black/10 bg-[var(--color-sea-deep)] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h2 className="text-sm font-semibold tracking-wide">Ask the guide</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 transition hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
          >
            {messages.length === 0 && (
              <p className="mx-auto max-w-[80%] text-center text-xs text-muted-foreground">
                Ask about the Aran Islands — holy wells, forts, folklore, cliffs. I only answer from the field-guide sources.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[var(--color-sea-deep)] px-3 py-2 text-sm text-white shadow-sm"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white/70 px-3 py-2 text-sm text-foreground shadow-sm ring-1 ring-black/5"
                  }
                >
                  {msg.content || (
                    <span className="inline-flex gap-1" aria-label="Thinking">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    </span>
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-black/10 bg-white/40 px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a place, story, or myth…"
              disabled={status !== "idle"}
              className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--color-sea-deep)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sea-deep)]/30 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status !== "idle" || !input.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-sea-deep)] text-white shadow-sm transition hover:bg-[var(--color-sea-deep)]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatPanel;
