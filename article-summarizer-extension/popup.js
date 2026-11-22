import { extractArticle } from "./extract.js";
import { summarize, ClaudeError, MAX_CHARS } from "./claude.js";
import { loadSettings, saveSettings } from "./settings.js";

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

  if (!settings.apiKey) {
    showStatus("Add your Anthropic API key in Settings to get started. ", true);
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
  }
}

async function run() {
  if (!tab?.id) return;
  if (/^(chrome|edge|about|chrome-extension|view-source):/i.test(tab.url || "")) {
    showStatus("Browser pages can't be summarized. Open an article and try again.", true);
    return;
  }

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
    setBusy(false);
    showStatus("Couldn't read this page (the browser blocks extensions on some sites, like the Web Store or PDF viewer).", true);
    return;
  }

  if (!article || article.text.trim().length < 80) {
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
  const length = els.length.value;
  let pending = false;
  try {
    await summarize({
      apiKey: settings.apiKey,
      model: settings.model,
      length,
      language: settings.language,
      article,
      signal: controller.signal,
      onText: (chunk) => {
        summaryText += chunk;
        // Batch DOM updates to one per frame.
        if (!pending) {
          pending = true;
          requestAnimationFrame(() => { pending = false; render(summaryText); });
        }
      },
    });
    render(summaryText);
    showStatus(`Done · ${wordCount(article.text).toLocaleString()} words → ${wordCount(summaryText).toLocaleString()}`);
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
