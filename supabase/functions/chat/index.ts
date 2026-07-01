// Supabase Edge Function: chat
// Streams Anthropic Messages API responses grounded in bundled source docs.

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const ipHits = new Map<string, number[]>();

function jsonError(status: number, message: string, extra?: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const hits = (ipHits.get(ip) ?? []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

// Load & cache bundled source docs from ./sources at cold start.
let sourcesCache: { name: string; content: string }[] | null = null;
async function loadSources(): Promise<{ name: string; content: string }[]> {
  if (sourcesCache) return sourcesCache;
  const dir = new URL("./sources/", import.meta.url);
  const out: { name: string; content: string }[] = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isFile) continue;
      if (entry.name.startsWith(".")) continue;
      const text = await Deno.readTextFile(new URL(entry.name, dir));
      out.push({ name: entry.name, content: text });
    }
  } catch (err) {
    console.error("Failed to read sources directory", err);
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  sourcesCache = out;
  return out;
}

function buildSystemPrompt(sources: { name: string; content: string }[]): string {
  const instructions = [
    "You are a guide for the Aran Islands map app.",
    "Answer ONLY using the provided source documents.",
    "Always cite which source you used (by filename).",
    "If the answer isn't in the sources, say so explicitly instead of guessing.",
    "Keep answers concise.",
  ].join(" ");

  const docs = sources
    .map((s) => `--- SOURCE: ${s.name} ---\n${s.content}`)
    .join("\n\n");

  return `${instructions}\n\n=== SOURCE DOCUMENTS ===\n${docs}`;
}

type Msg = { role: "user" | "assistant"; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonError(405, "Method not allowed");

  const ip = clientIp(req);
  if (rateLimited(ip)) return jsonError(429, "Rate limit exceeded. Max 20 requests per minute.");

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return jsonError(500, "ANTHROPIC_API_KEY is not configured on the server.");

  let body: { question?: string; history?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }
  const question = (body.question ?? "").trim();
  if (!question) return jsonError(400, "Missing 'question' in request body.");
  const history: Msg[] = Array.isArray(body.history)
    ? body.history.filter(
        (m): m is Msg =>
          !!m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
    : [];

  const sources = await loadSources();
  if (sources.length === 0) {
    return jsonError(500, "No source documents are bundled with the chat function.");
  }
  const system = buildSystemPrompt(sources);

  const messages = [...history, { role: "user", content: question }];

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        stream: true,
        system,
        messages,
      }),
    });
  } catch (err) {
    console.error("Anthropic fetch failed", err);
    return jsonError(502, "Failed to reach Anthropic API.");
  }

  if (!anthropicRes.ok || !anthropicRes.body) {
    const detail = await anthropicRes.text().catch(() => "");
    console.error("Anthropic error", anthropicRes.status, detail);
    return jsonError(anthropicRes.status, "Anthropic API error.", { detail });
  }

  // Stream the raw SSE from Anthropic straight through to the client.
  return new Response(anthropicRes.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      ...CORS_HEADERS,
    },
  });
});
