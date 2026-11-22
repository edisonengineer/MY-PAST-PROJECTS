// Minimal Claude Messages API client for the extension (raw HTTP + SSE streaming).
// An unpacked extension has no build step, so the npm SDK can't be imported here.

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2026-10-21";

// Very long pages are cut at this many characters (the UI tells the user when it happens).
export const MAX_CHARS = 600000;

// Models that support server-side refusal fallbacks ("default" routing).
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

const LENGTHS = {
  short: "3-5 bullet points, one line each.",
  medium: "A one-sentence TL;DR, then 5-8 bullet points covering the key points.",
  detailed: "A one-sentence TL;DR, then a few short sections with headings covering the main arguments, evidence, and conclusions.",
};

const SYSTEM_PROMPT =
  "You summarize web articles for a busy reader. Be accurate and neutral: only state what the " +
  "article says, and don't add outside facts or opinions. Keep names, numbers, and dates exact. " +
  "If the text is not really an article (e.g. a login page or a list of links), say so briefly " +
  "and summarize what is there. Format with Markdown: '**TL;DR:**' for the TL;DR line, '- ' for " +
  "bullets, '### ' for headings. Do not add a preamble like 'Here is a summary'.";

export class ClaudeError extends Error {}

/**
 * Stream a summary. Calls onText(chunk) as text arrives. Resolves with the full text.
 */
export async function summarize({ apiKey, model, length, language, article, signal, onText }) {
  const lang = language && language.trim() ? language.trim() : "the same language as the article";
  const userText =
    `<article title="${escapeAttr(article.title)}" url="${escapeAttr(article.url)}">\n` +
    `${article.text}\n</article>\n\n` +
    `Summarize this article. Format: ${LENGTHS[length] || LENGTHS.medium} Write the summary in ${lang}.`;

  const body = {
    model,
    max_tokens: 64000,
    stream: true,
    system: SYSTEM_PROMPT,
    output_config: { effort: "low" },
    messages: [{ role: "user", content: userText }],
  };

  const headers = {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": API_VERSION,
    // Required for requests made from a browser context; the key stays in local extension storage.
    "anthropic-dangerous-direct-browser-access": "true",
  };

  if (FALLBACK_MODELS.has(model)) {
    body.fallbacks = "default";
    headers["anthropic-beta"] = "server-side-fallback-2026-07-01";
  }

  let res;
  try {
    res = await fetch(API_URL, { method: "POST", headers, body: JSON.stringify(body), signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new ClaudeError("Network error: couldn't reach the Claude API. Check your connection.");
  }

  if (!res.ok) {
    throw new ClaudeError(await describeHttpError(res));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let stopReason = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = rawEvent.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
      if (!dataLine) continue;

      let evt;
      try { evt = JSON.parse(dataLine); } catch { continue; }

      if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
        full += evt.delta.text;
        onText?.(evt.delta.text);
      } else if (evt.type === "message_delta" && evt.delta?.stop_reason) {
        stopReason = evt.delta.stop_reason;
      } else if (evt.type === "error") {
        throw new ClaudeError(`API error: ${evt.error?.message || "unknown error"}`);
      }
    }
  }

  if (stopReason === "refusal") {
    throw new ClaudeError("Claude declined to summarize this page.");
  }
  if (stopReason === "max_tokens") {
    full += "\n\n_(Summary was cut off at the output limit.)_";
    onText?.("\n\n_(Summary was cut off at the output limit.)_");
  }
  return full;
}

async function describeHttpError(res) {
  let msg = "";
  try {
    const data = await res.json();
    msg = data?.error?.message || "";
  } catch { /* ignore */ }
  switch (res.status) {
    case 401: return "Invalid API key. Open Settings and check your Anthropic API key.";
    case 403: return `Permission denied. ${msg}`;
    case 404: return `Model not found. Pick another model in Settings. ${msg}`;
    case 413: return "This page is too large to send. Try selecting part of it first.";
    case 429: return "Rate limited by the API. Wait a moment and try again.";
    case 529: return "The API is overloaded right now. Try again shortly.";
    default:
      if (res.status >= 500) return `Claude API server error (${res.status}). Try again.`;
      return `Request failed (${res.status}). ${msg}`;
  }
}

function escapeAttr(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
