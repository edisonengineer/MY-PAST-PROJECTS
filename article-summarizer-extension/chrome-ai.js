// Free, on-device summaries using Chrome's built-in Summarizer API (Gemini Nano).
// No API key, no cost, and the page text never leaves the computer.
// Needs a recent desktop Chrome on hardware that can run the model; the first use
// downloads the model once. When it's not available we fall back to offline.js.

/** Returns "available" | "downloadable" | "downloading" | "unavailable" | "unsupported". */
export async function chromeAIStatus() {
  if (!("Summarizer" in self)) return "unsupported";
  try {
    return await self.Summarizer.availability();
  } catch {
    return "unavailable";
  }
}

// Languages the built-in model can write summaries in.
const OUTPUT_LANGS = { english: "en", en: "en", spanish: "es", "español": "es", es: "es", japanese: "ja", "日本語": "ja", ja: "ja" };

function langCode(language) {
  return OUTPUT_LANGS[String(language || "").trim().toLowerCase()];
}

async function createSummarizer(options, language, onDownload) {
  const opts = {
    ...options,
    format: "markdown",
    sharedContext: "A web article the user is reading.",
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => onDownload?.(e.loaded));
    },
  };
  const code = langCode(language);
  if (code) opts.outputLanguage = code;
  try {
    return await self.Summarizer.create(opts);
  } catch (e) {
    // Retry without the language option in case this Chrome version rejects it.
    if (opts.outputLanguage) {
      delete opts.outputLanguage;
      return await self.Summarizer.create(opts);
    }
    throw e;
  }
}

const PLAN = {
  short: { tldr: false, points: "short" },
  medium: { tldr: true, points: "medium" },
  detailed: { tldr: true, points: "long" },
};

/**
 * Start creating the summarizers right away. Call this synchronously inside the click
 * handler: Chrome only allows the first-time model download during a user click.
 */
export function prepareChromeAI({ length, language, onDownload }) {
  const plan = PLAN[length] || PLAN.medium;
  return {
    plan,
    points: createSummarizer({ type: "key-points", length: plan.points }, language, onDownload),
    tldr: plan.tldr ? createSummarizer({ type: "tldr", length: "short" }, language, onDownload) : null,
  };
}

/** Summarize with the prepared summarizers. Calls onText(fullTextSoFar). */
export async function summarizeWithChromeAI(prepared, article, { signal, onText }) {
  const [p, t] = await Promise.allSettled([prepared.points, prepared.tldr]);
  const points = p.status === "fulfilled" ? p.value : null;
  const tldr = t.status === "fulfilled" ? t.value : null;
  if (!points) {
    tldr?.destroy?.();
    throw p.reason;
  }
  try {
    // The on-device model takes limited input, so long articles are condensed in pieces first.
    const text = await condense(points, article.text, signal);
    const context = `Title: ${article.title}`;

    let head = "";
    if (tldr) {
      const t = await tldr.summarize(text, { context, signal });
      head = `**TL;DR:** ${t.trim()}\n\n`;
      onText(head);
    }

    let body = "";
    const stream = points.summarizeStreaming(text, { context, signal });
    for await (const chunk of stream) {
      // Older Chrome versions send the whole text so far; newer ones send only the new part.
      body = chunk.startsWith(body) && body.length > 0 ? chunk : body + chunk;
      onText(head + body);
    }
    return head + body;
  } finally {
    points.destroy?.();
    tldr?.destroy?.();
  }
}

async function fits(summarizer, text) {
  const quota = summarizer.inputQuota;
  if (!quota || !Number.isFinite(quota) || !summarizer.measureInputUsage) {
    return text.length <= 12000;
  }
  try {
    return (await summarizer.measureInputUsage(text)) <= quota * 0.9;
  } catch {
    return text.length <= 12000;
  }
}

function splitIntoChunks(text, maxChars) {
  const paras = text.split(/\n{2,}/);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if (p.length > maxChars) {
      if (cur) { chunks.push(cur); cur = ""; }
      for (let i = 0; i < p.length; i += maxChars) chunks.push(p.slice(i, i + maxChars));
    } else if ((cur + "\n\n" + p).length > maxChars) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function condense(summarizer, text, signal, depth = 0) {
  if (depth > 3 || (await fits(summarizer, text))) return text;
  let maxChars = summarizer.inputQuota && Number.isFinite(summarizer.inputQuota)
    ? Math.floor(summarizer.inputQuota * 2.5)
    : 10000;
  const parts = [];
  for (let chunk of splitIntoChunks(text, maxChars)) {
    while (!(await fits(summarizer, chunk)) && chunk.length > 1000) {
      chunk = chunk.slice(0, Math.floor(chunk.length * 0.75));
    }
    parts.push((await summarizer.summarize(chunk, { signal })).trim());
  }
  return condense(summarizer, parts.join("\n\n"), signal, depth + 1);
}
