const { app, ScriptLanguage, UndoModes, FitOptions } = require("indesign");
const { storage } = require("uxp");

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
const KEY_NAME = "gemini-api-key";
const TEXT_MODELS = ["gemini-3.8-flash"];
// Tried in order when the configured image model doesn't exist for this key.
const IMAGE_MODELS = ["gemini-3.1-flash-image", "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image"];
const ASPECTS = { "1:1": 1, "4:3": 4 / 3, "16:9": 16 / 9, "3:4": 3 / 4, "9:16": 9 / 16 };

const SYSTEM_PROMPT =
  "You write copy that will be placed directly into an Adobe InDesign layout. " +
  "Return only the final text: no preamble, no explanations, no quotation marks around it, " +
  "and no Markdown (no **bold**, # headings, or bullet symbols unless the user asks for a list).";

const ACTIONS = {
  generate: (prompt, sel) =>
    sel ? `${prompt}\n\nUse this existing text as context:\n${sel}` : prompt,
  rewrite: (prompt, sel) =>
    `Rewrite the following text. ${prompt || "Improve clarity and flow, keep the meaning."}\n\n${sel}`,
  shorten: (prompt, sel) =>
    `Shorten the following text while keeping the key points. ${prompt}\n\n${sel}`,
  expand: (prompt, sel) =>
    `Expand the following text with more detail, same tone. ${prompt}\n\n${sel}`,
  proofread: (prompt, sel) =>
    `Correct spelling, grammar and punctuation in the following text. Change nothing else. ${prompt}\n\n${sel}`,
  translate: (prompt, sel) =>
    `Translate the following text ${prompt ? "into " + prompt : "into English"}. Keep line breaks.\n\n${sel}`,
  headline: (prompt, sel) =>
    `Write 5 short headline options for the following text, one per line. ${prompt}\n\n${sel}`,
};

const HINTS = {
  generate: "Type what you want written. No selection needed.",
  translate: "Select text in the document, then type the target language (e.g. Swahili).",
};
const DEFAULT_HINT = "Select text or a text frame in the document first.";

const TEXT_TYPES = [
  "Text", "Word", "Character", "Paragraph", "Line", "TextStyleRange",
  "TextColumn", "InsertionPoint", "Story",
];
const GRAPHIC_FRAMES = ["Rectangle", "Oval", "Polygon"];

const $ = (id) => document.getElementById(id);
let lastImage = null; // { data: base64, mimeType, aspect }

// ---------- UI basics ----------

function setStatus(msg, kind = "") {
  $("status").textContent = msg;
  $("status").className = msg ? "show " + kind : "";
  if (kind === "error") console.error("[Gemini Writer]", msg);
}

// Shows "Writing… 3s" while a request runs and disables the button.
async function busy(button, label, work) {
  const start = Date.now();
  button.disabled = true;
  setStatus(label + "…");
  const timer = setInterval(() => {
    setStatus(`${label}… ${Math.round((Date.now() - start) / 1000)}s`);
  }, 1000);
  try {
    return await work();
  } finally {
    clearInterval(timer);
    button.disabled = false;
  }
}

function showTab(tab) {
  ["tabText", "tabImage"].forEach((id) => {
    const el = $(id);
    const active = id === tab.id;
    el.className = active ? "tab active" : "tab";
    $(el.getAttribute("data-panel")).className = active ? "" : "hidden";
  });
  localStorage.setItem("gemini-tab", tab.id);
  setStatus("");
}

function showSettings(show) {
  $("settings").className = show ? "card" : "card hidden";
  $("toggleSettings").className = show ? "tab small active" : "tab small";
}

function updateHint() {
  $("actionHint").textContent = HINTS[$("action").value] || DEFAULT_HINT;
}

// ---------- settings ----------

async function saveKey(key) {
  try {
    await storage.secureStorage.setItem(KEY_NAME, key);
  } catch (e) {
    localStorage.setItem(KEY_NAME, key);
  }
}

async function loadKey() {
  try {
    const raw = await storage.secureStorage.getItem(KEY_NAME);
    if (raw) return typeof raw === "string" ? raw : String.fromCharCode(...raw);
  } catch (e) {
    // secureStorage unavailable; fall through
  }
  return localStorage.getItem(KEY_NAME) || "";
}

const SETTINGS = { model: "gemini-model", imageModel: "gemini-image-model", speed: "gemini-speed", temperature: "gemini-temp" };

async function initSettings() {
  $("apiKey").value = await loadKey();
  for (const [id, storeKey] of Object.entries(SETTINGS)) {
    const saved = localStorage.getItem(storeKey);
    if (saved) $(id).value = saved;
  }
  // Older versions saved gemini-2.5-flash, which is closed to new users.
  if ($("model").value === "gemini-2.5-flash") $("model").value = TEXT_MODELS[0];
  showSettings(!$("apiKey").value);
  updateHint();
  const tab = $(localStorage.getItem("gemini-tab") || "tabText");
  if (tab) showTab(tab);
}

function saveSettings() {
  for (const [id, storeKey] of Object.entries(SETTINGS)) {
    localStorage.setItem(storeKey, $(id).value.trim());
  }
  return saveKey($("apiKey").value.trim());
}

// ---------- InDesign helpers ----------

function getSelection() {
  if (app.documents.length === 0) return null;
  const sel = app.selection;
  return sel && sel.length ? sel[0] : null;
}

function selectionKind(sel) {
  if (!sel) return null;
  const name = sel.constructorName;
  if (TEXT_TYPES.includes(name)) return "text";
  if (name === "TextFrame") return "frame";
  if (GRAPHIC_FRAMES.includes(name)) return "graphicFrame";
  // An image selected with the Direct Selection tool: use its frame.
  if (sel.parent && GRAPHIC_FRAMES.includes(sel.parent.constructorName)) return "graphic";
  return null;
}

function getSelectedText() {
  const sel = getSelection();
  const kind = selectionKind(sel);
  if (kind === "text") return sel.contents || "";
  if (kind === "frame") return sel.parentStory.contents || "";
  return "";
}

function selectedGraphicFrame() {
  const sel = getSelection();
  const kind = selectionKind(sel);
  if (kind === "graphicFrame") return sel;
  if (kind === "graphic") return sel.parent;
  return null;
}

// InDesign uses \r for paragraph breaks.
function toInDesignText(text) {
  return text.replace(/\r\n|\n/g, "\r");
}

// Bounds of the page's margin area, optionally shrunk to an aspect ratio and centered.
function marginBounds(page, ratio) {
  const [y1, x1, y2, x2] = page.bounds;
  const m = page.marginPreferences;
  let top = y1 + m.top, left = x1 + m.left, bottom = y2 - m.bottom, right = x2 - m.right;
  if (ratio) {
    const w = right - left, h = bottom - top;
    if (w / h > ratio) {
      const nw = h * ratio;
      left += (w - nw) / 2;
      right = left + nw;
    } else {
      const nh = w / ratio;
      top += (h - nh) / 2;
      bottom = top + nh;
    }
  }
  return [top, left, bottom, right];
}

function newFrameOnActivePage(text) {
  const page = app.activeWindow.activePage;
  const frame = page.textFrames.add({ geometricBounds: marginBounds(page) });
  frame.contents = text;
  return frame;
}

function insertText(text, mode) {
  if (app.documents.length === 0) throw new Error("Open a document first.");
  const sel = getSelection();
  const kind = selectionKind(sel);
  text = toInDesignText(text);

  if (mode === "frame" || (kind !== "text" && kind !== "frame")) {
    newFrameOnActivePage(text);
    return "Inserted in a new text frame.";
  }
  if (kind === "frame") {
    const story = sel.parentStory;
    if (mode === "auto") story.contents = text;
    else story.insertionPoints.lastItem().contents = "\r" + text;
    return mode === "auto" ? "Replaced frame text." : "Added after frame text.";
  }
  // text selection or cursor
  if (mode === "after" && sel.constructorName !== "InsertionPoint") {
    sel.insertionPoints.lastItem().contents = text;
    return "Inserted after selection.";
  }
  sel.contents = text;
  return sel.constructorName === "InsertionPoint" ? "Inserted at cursor." : "Replaced selection.";
}

// Run as one undo step so Ctrl/Cmd+Z reverts the whole insert.
function undoable(name, fn) {
  let result;
  try {
    app.doScript(() => { result = fn(); }, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, name);
  } catch (e) {
    if (result !== undefined) return result;
    result = fn();
  }
  return result;
}

function base64ToBytes(b64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  b64 = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes = new Uint8Array(Math.floor((b64.length * 3) / 4));
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const a = lookup[b64.charCodeAt(i)], b = lookup[b64.charCodeAt(i + 1)];
    const c = lookup[b64.charCodeAt(i + 2)], d = lookup[b64.charCodeAt(i + 3)];
    bytes[p++] = (a << 2) | (b >> 4);
    if (i + 2 < b64.length) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < b64.length) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes.slice(0, p);
}

// Saves the image in the plugin's data folder (persists across restarts).
async function saveImageFile(image) {
  const folder = await storage.localFileSystem.getDataFolder();
  const ext = image.mimeType === "image/jpeg" ? "jpg" : "png";
  const file = await folder.createFile(`gemini-${Date.now()}.${ext}`, { overwrite: true });
  await file.write(base64ToBytes(image.data).buffer, { format: storage.formats.binary });
  return file;
}

function placeImage(file, embed) {
  if (app.documents.length === 0) throw new Error("Open a document first.");
  let frame = selectedGraphicFrame();
  const usedSelection = !!frame;
  if (!frame) {
    const page = app.activeWindow.activePage;
    frame = page.rectangles.add({ geometricBounds: marginBounds(page, ASPECTS[lastImage.aspect] || 1) });
  }
  try {
    frame.place(file.nativePath);
  } catch (e) {
    frame.place(file);
  }
  frame.fit(FitOptions.FILL_PROPORTIONALLY);
  frame.fit(FitOptions.CENTER_CONTENT);
  if (embed) {
    try {
      frame.allGraphics[0].itemLink.unlink();
    } catch (e) {
      // keep it linked if embedding isn't possible
    }
  }
  return usedSelection ? "Image placed in the selected frame." : "Image placed in a new frame.";
}

// Picks the supported aspect ratio closest to the selected frame's shape.
function aspectForSelection() {
  const frame = selectedGraphicFrame();
  if (!frame) return "1:1";
  const [y1, x1, y2, x2] = frame.geometricBounds;
  const ratio = (x2 - x1) / (y2 - y1);
  let best = "1:1";
  for (const key of Object.keys(ASPECTS)) {
    if (Math.abs(Math.log(ASPECTS[key] / ratio)) < Math.abs(Math.log(ASPECTS[best] / ratio))) best = key;
  }
  return best;
}

// ---------- Gemini ----------

class GeminiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function getKey() {
  const key = $("apiKey").value.trim() || (await loadKey());
  if (!key) throw new GeminiError("Add your Gemini API key in Settings.");
  return key;
}

async function requestGemini(key, model, body) {
  let res;
  try {
    res = await fetch(`${API_BASE}${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new GeminiError("Could not reach Gemini. Check your internet connection. (" + e.message + ")");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GeminiError((data.error && data.error.message) || `Gemini request failed (${res.status}).`, res.status);
  }
  return data;
}

// Runs a request with the model from a settings field. If Google says the model
// is retired (and names a replacement) or it doesn't exist, moves to the next one
// and remembers it.
async function withModel(fieldId, storeKey, fallbacks, run) {
  const chosen = $(fieldId).value.trim() || fallbacks[0];
  const tried = [];
  let model = chosen;
  for (;;) {
    tried.push(model);
    try {
      const result = await run(model);
      if (model !== chosen) {
        $(fieldId).value = model;
        localStorage.setItem(storeKey, model);
      }
      return result;
    } catch (e) {
      const retired = /no longer available.*?use models\/([\w.-]+)/i.exec(e.message);
      let next = retired && retired[1];
      if (!next && e.status === 404) next = fallbacks.find((m) => !tried.includes(m));
      if (!next || tried.includes(next)) throw e;
      model = next;
    }
  }
}

function partsFromResponse(data) {
  const candidate = data.candidates && data.candidates[0];
  const parts = (candidate && candidate.content && candidate.content.parts) || [];
  return { candidate, parts, text: parts.filter((p) => !p.thought).map((p) => p.text || "").join("") };
}

function emptyReason(data, candidate) {
  return (candidate && candidate.finishReason) ||
    (data.promptFeedback && data.promptFeedback.blockReason) || "empty response";
}

// One text request, stepping down the thinking level if the model rejects it.
// Gemini 3 models think at "high" by default, which is slow.
async function textRequest(key, model, prompt) {
  const temperature = parseFloat($("temperature").value) || 0.7;
  const levels = [$("speed").value || "minimal", "low", null].filter((v, i, a) => a.indexOf(v) === i);
  for (let i = 0; ; i++) {
    const generationConfig = { temperature };
    if (levels[i]) generationConfig.thinkingConfig = { thinkingLevel: levels[i] };
    try {
      return await requestGemini(key, model, {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
    } catch (e) {
      if (e.status !== 400 || !/think/i.test(e.message) || i === levels.length - 1) throw e;
    }
  }
}

// A free-tier limit that won't clear within a minute (daily limit, or limit 0).
function isLongFreeLimit(e) {
  if (e.status !== 429 || !/free_tier/i.test(e.message)) return false;
  const wait = /retry in\s+([\dhms.]+)/i.exec(e.message);
  return !wait || /[hm]/.test(wait[1]);
}

// Flash-Lite models usually have a much larger free allowance. Newest first.
async function liteModels(key) {
  const res = await fetch(`${API_BASE}?pageSize=200`, { headers: { "x-goog-api-key": key } });
  const data = await res.json().catch(() => ({}));
  const version = (name) => parseFloat((/gemini-([\d.]+)/.exec(name) || [0, 0])[1]);
  return (data.models || [])
    .filter((m) => /flash-lite/.test(m.name) && !/image|tts|audio/.test(m.name) &&
      (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .sort((a, b) => version(b) - version(a) || /preview/.test(a) - /preview/.test(b));
}

let switchedModel = null; // set when generateText moves to a Lite model

async function generateText(prompt) {
  const key = await getKey();
  switchedModel = null;
  let data;
  try {
    data = await withModel("model", SETTINGS.model, TEXT_MODELS, (model) => textRequest(key, model, prompt));
  } catch (e) {
    if (!isLongFreeLimit(e)) throw e;
    const current = $("model").value.trim();
    const candidates = (await liteModels(key).catch(() => [])).filter((m) => m !== current);
    for (const model of candidates) {
      try {
        data = await textRequest(key, model, prompt);
        $("model").value = model;
        localStorage.setItem(SETTINGS.model, model);
        switchedModel = model;
        break;
      } catch (err) {
        if (!isLongFreeLimit(err) && err.status !== 404) throw err;
      }
    }
    if (!data) throw e;
  }

  const { candidate, text } = partsFromResponse(data);
  if (!text) throw new GeminiError(`Gemini returned no text (${emptyReason(data, candidate)}).`);
  return stripMarkdown(text.trim());
}

async function generateImage(prompt, aspect) {
  const key = await getKey();
  const data = await withModel("imageModel", SETTINGS.imageModel, IMAGE_MODELS, (model) =>
    requestGemini(key, model, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: aspect },
      },
    })
  );
  const { candidate, parts, text } = partsFromResponse(data);
  const image = parts.map((p) => p.inlineData || p.inline_data).find(Boolean);
  if (!image) {
    throw new GeminiError(text ? `No image returned. Gemini said: ${text}` : `No image returned (${emptyReason(data, candidate)}).`);
  }
  return { data: image.data, mimeType: image.mimeType || image.mime_type || "image/png", aspect };
}

function friendlyError(e, forImage) {
  if (forImage && /free_tier[\s\S]*limit: 0/.test(e.message)) {
    return "Image generation isn't included in the free tier for your API key, so waiting won't help. " +
      "To use images, turn on billing for the key in Google AI Studio. Text keeps working for free.";
  }
  if (e.status === 429 || /quota|exhausted/i.test(e.message)) {
    const wait = /retry in\s+(?:(\d+)h)?(?:(\d+)m)?/i.exec(e.message);
    const limit = /limit: (\d+)/.exec(e.message);
    if (isLongFreeLimit(e) && wait && (wait[1] || wait[2])) {
      const when = wait[1] ? `about ${wait[1]} hours` : `about ${wait[2]} minutes`;
      return (forImage ? "Daily free image limit used up" : "Daily free text limit used up") +
        (limit ? ` (${limit[1]} requests per day)` : "") +
        `. It resets in ${when}. To keep working now, turn on billing for the key, or set another model in Settings.`;
    }
    return "Too many requests in a short time. Wait a minute and try again.";
  }
  return e.message;
}

function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1");
}

// ---------- events ----------

$("tabText").addEventListener("click", () => showTab($("tabText")));
$("tabImage").addEventListener("click", () => showTab($("tabImage")));
$("toggleSettings").addEventListener("click", () => {
  showSettings($("settings").className.indexOf("hidden") !== -1);
});
$("action").addEventListener("change", updateHint);

$("saveSettings").addEventListener("click", async () => {
  await saveSettings();
  showSettings(false);
  setStatus("Settings saved.", "ok");
});

$("testKey").addEventListener("click", async () => {
  try {
    await saveSettings();
    const reply = await busy($("testKey"), "Testing connection", () => generateText("Reply with the single word: OK"));
    setStatus(`Connected. Gemini replied: ${reply}`, "ok");
  } catch (e) {
    setStatus(friendlyError(e, false), "error");
  }
});

$("generate").addEventListener("click", async () => {
  const action = $("action").value;
  const prompt = $("prompt").value.trim();
  const selected = $("useSelection").checked || action !== "generate" ? getSelectedText() : "";

  if (action !== "generate" && !selected) {
    setStatus('This action needs text selected in the document. Select text or a text frame, or switch Action to "Write new text".', "error");
    return;
  }
  if (action === "generate" && !prompt) {
    setStatus("Type what you want Gemini to write.", "error");
    return;
  }
  try {
    $("result").value = await busy($("generate"), "Writing", () => generateText(ACTIONS[action](prompt, selected)));
    setStatus(switchedModel
      ? `Done. The daily free limit ran out, so the plugin switched to ${switchedModel} (change it in Settings).`
      : "Done. Review the result, then insert it.", "ok");
  } catch (e) {
    setStatus(friendlyError(e, false), "error");
  }
});

$("insert").addEventListener("click", () => {
  const text = $("result").value;
  if (!text.trim()) {
    setStatus("Nothing to insert yet.", "error");
    return;
  }
  try {
    setStatus(undoable("Insert Gemini text", () => insertText(text, $("insertMode").value)), "ok");
  } catch (e) {
    setStatus(e.message, "error");
  }
});

$("generateImage").addEventListener("click", async () => {
  const prompt = $("imagePrompt").value.trim();
  if (!prompt) {
    setStatus("Describe the image you want.", "error");
    return;
  }
  const aspect = $("aspect").value === "auto" ? aspectForSelection() : $("aspect").value;
  try {
    lastImage = await busy($("generateImage"), "Creating image", () => generateImage(prompt, aspect));
    $("preview").src = `data:${lastImage.mimeType};base64,${lastImage.data}`;
    $("preview").className = "";
    $("previewEmpty").className = "hidden";
    setStatus("Image ready. Select a frame (or nothing) and click Place.", "ok");
  } catch (e) {
    setStatus(friendlyError(e, true), "error");
  }
});

$("placeImage").addEventListener("click", async () => {
  if (!lastImage) {
    setStatus("Generate an image first.", "error");
    return;
  }
  try {
    const file = await saveImageFile(lastImage);
    setStatus(undoable("Place Gemini image", () => placeImage(file, $("embedImage").checked)), "ok");
  } catch (e) {
    setStatus("Could not place the image: " + e.message, "error");
  }
});

initSettings().catch((e) => setStatus("Startup error: " + e.message, "error"));
