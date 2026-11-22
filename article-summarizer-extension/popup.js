import { extractArticle } from "./extract.js";
import { summarize, ClaudeError, MAX_CHARS } from "./claude.js";
import { loadSettings, saveSettings } from "./settings.js";
import { chromeAIStatus, prepareChromeAI, summarizeWithChromeAI } from "./chrome-ai.js";
import { summarizeOffline } from "./offline.js";

const $ = (id) => document.getElementById(id);
const els = {
  page: $("page"), length: $("length"), go: $("go"), stop: $("stop"),
  status: $("status"), output: $("output"), actions: $("actions"),
  copy: $("copy"), redo: $("redo"), settings: $("settings"),
};

let settings;
let tab;
let controller = null;
let summaryText = "";
let aiStatus = "unsupported";

const ENGINE_NAMES = { claude: "Claude", chrome: "Chrome built-in AI", offline: "Offline mode" };

init();

async function init() {
  settings = await loadSettings();
  els.length.value = settings.length;

  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  els.page.textContent = tab?.title || "";

  els.settings.addEventListener("click", () => chrome.runtime.openOptionsPage());
  els.go.addEventListener("click", run);
  els.redo.addEventListener("click", run);
  els.stop.addEventListener("click", () => controller?.abort());
  els.copy.addEventListener("click", copySummary);
  els.length.addEventListener("change", () => saveSettings({ length: els.length.value }));

  if (settings.provider === "free") aiStatus = await chromeAIStatus();

  if (settings.provider === "claude" && !settings.apiKey) {
    showStatus("Add your Anthropic API key in Settings, or switch to a free engine. ", true);
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = "Open Settings";
    link.addEventListener("click", (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
    els.status.appendChild(link);
    els.go.disabled = true;
    return;
  }

  // Show a cached summary for this page if we already made one this browser session.
  const cached = await getCached();
  if (cached) {
    summaryText = cached.text;
    render(summaryText);
    els.length.value = cached.length;
    showStatus("Summary from earlier — click Regenerate for a fresh one.");
    els.actions.hidden = false;
  } else {
    showStatus(engineHint());
  }
}

// Which engine will actually run for this click.
function pickEngine() {
  if (settings.provider === "claude") return "claude";
  if (settings.provider === "offline") return "offline";
  return ["available", "downloadable", "downloading"].includes(aiStatus) ? "chrome" : "offline";
}

function engineHint() {
  const engine = pickEngine();
  if (settings.provider === "free" && engine === "offline") {
    return "Using free Offline mode (Chrome built-in AI isn't available in this browser).";
  }
  if (engine === "chrome" && aiStatus !== "available") {
    return "Using Chrome built-in AI. The first summary downloads the model once, which can take a few minutes.";
  }
  return `Engine: ${ENGINE_NAMES[engine]}`;
}

async function run() {
  if (!tab?.id) return;
  if (/^(chrome|edge|about|chrome-extension|view-source):/i.test(tab.url || "")) {
    showStatus("Browser pages can't be summarized. Open an article and try again.", true);
    return;
  }

  const engine = pickEngine();
  const length = els.length.value;
  // Must start inside the click (before any await): Chrome only lets the model download on a user click.
  const prepared = engine === "chrome"
    ? prepareChromeAI({
        length,
        language: settings.language,
        onDownload: (p) => showStatus(`Downloading Chrome's built-in AI model… ${Math.round(p * 100)}% (one time only)`),
      })
    : null;
  const release = () => {
    prepared?.points.then((x) => x.destroy?.(), () => {});
    prepared?.tldr?.then((x) => x.destroy?.(), () => {});
  };

  setBusy(true);
  summaryText = "";
  els.output.hidden = true;
  els.actions.hidden = true;
  showStatus("Reading the page…");

  let article;
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractArticle,
    });
    article = result?.result;
  } catch (e) {
    release();
    setBusy(false);
    showStatus("Couldn't read this page (the browser blocks extensions on some sites, like the Web Store or PDF viewer).", true);
    return;
  }

  if (!article || article.text.trim().length < 80) {
    release();
    setBusy(false);
    showStatus("Couldn't find article text on this page. Try selecting the text you want summarized, then click Summarize.", true);
    return;
  }

  let note = article.source === "selection" ? "Summarizing your selection" : "Summarizing";
  if (article.text.length > MAX_CHARS) {
    article.text = article.text.slice(0, MAX_CHARS);
    note += " (the page is very long, so only the first part is included)";
  }
  showStatus(`${note}… ${wordCount(article.text).toLocaleString()} words`);

  controller = new AbortController();
  let pending = false;
  const show = (full) => {
    summaryText = full;
    // Batch DOM updates to one per frame.
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => { pending = false; render(summaryText); });
    }
  };

  let used = engine;
  try {
    if (engine === "claude") {
      let acc = "";
      await summarize({
        apiKey: settings.apiKey,
        model: settings.model,
        length,
        language: settings.language,
        article,
        signal: controller.signal,
        onText: (chunk) => show((acc += chunk)),
      });
    } else if (engine === "chrome") {
      try {
        await summarizeWithChromeAI(prepared, article, { signal: controller.signal, onText: show });
      } catch (e) {
        if (e.name === "AbortError") throw e;
        console.warn("Chrome built-in AI failed, using offline mode:", e);
        used = "offline";
        show(summarizeOffline(article, length));
      }
    } else {
      show(summarizeOffline(article, length));
    }
    render(summaryText);
    showStatus(`Done with ${ENGINE_NAMES[used]} · ${wordCount(article.text).toLocaleString()} words → ${wordCount(summaryText).toLocaleString()}`);
    await setCached({ text: summaryText, length });
    els.actions.hidden = false;
  } catch (e) {
    if (e.name === "AbortError") {
      showStatus("Stopped.");
      if (summaryText) els.actions.hidden = false;
    } else {
      showStatus(e instanceof ClaudeError ? e.message : `Something went wrong: ${e.message}`, true);
    }
  } finally {
    controller = null;
    setBusy(false);
  }
}

function setBusy(busy) {
  els.go.disabled = busy;
  els.go.textContent = busy ? "Working…" : "Summarize";
  els.stop.hidden = !busy;
  els.length.disabled = busy;
}

function showStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.classList.toggle("error", isError);
}

async function copySummary() {
  await navigator.clipboard.writeText(summaryText);
  els.copy.textContent = "Copied!";
  setTimeout(() => (els.copy.textContent = "Copy"), 1200);
}

function wordCount(s) {
  return (s.match(/\S+/g) || []).length;
}

// ---- cache (per URL, cleared when the browser closes) ----
const cacheKey = () => `summary:${tab?.url}`;
async function getCached() {
  const key = cacheKey();
  const data = await chrome.storage.session.get(key);
  return data[key];
}
async function setCached(value) {
  await chrome.storage.session.set({ [cacheKey()]: value });
}

// ---- tiny, safe Markdown renderer (escapes all HTML first) ----
function render(md) {
  els.output.hidden = false;
  els.output.innerHTML = markdownToHtml(md);
  els.output.scrollTop = els.output.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|\W)_(?!\s)(.+?)_(?=\W|$)/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownToHtml(md) {
  const out = [];
  let inList = false;
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/) || line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }
    if (inList) { out.push("</ul>"); inList = false; }
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) out.push(`<h3>${inline(heading[1])}</h3>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (inList) out.push("</ul>");
  return out.join("");
}
