const { app, ScriptLanguage, UndoModes } = require("indesign");
const { storage } = require("uxp");

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
const KEY_NAME = "gemini-api-key";

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

const TEXT_TYPES = [
  "Text", "Word", "Character", "Paragraph", "Line", "TextStyleRange",
  "TextColumn", "InsertionPoint", "Story",
];

const $ = (id) => document.getElementById(id);

function setStatus(msg, isError = false) {
  $("status").textContent = msg;
  $("status").className = isError ? "error" : "";
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

async function initSettings() {
  $("apiKey").value = await loadKey();
  $("model").value = localStorage.getItem("gemini-model") || $("model").value;
  $("temperature").value = localStorage.getItem("gemini-temp") || $("temperature").value;
  $("tempValue").textContent = $("temperature").value;
  if (!$("apiKey").value) $("settings").open = true;
}

$("temperature").addEventListener("input", () => {
  $("tempValue").textContent = $("temperature").value;
});

$("saveSettings").addEventListener("click", async () => {
  await saveKey($("apiKey").value.trim());
  localStorage.setItem("gemini-model", $("model").value.trim());
  localStorage.setItem("gemini-temp", $("temperature").value);
  $("settings").open = false;
  setStatus("Settings saved.");
});

// ---------- InDesign selection helpers ----------

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
  return null;
}

function getSelectedText() {
  const sel = getSelection();
  const kind = selectionKind(sel);
  if (kind === "text") return sel.contents || "";
  if (kind === "frame") return sel.parentStory.contents || "";
  return "";
}

// InDesign uses \r for paragraph breaks.
function toInDesignText(text) {
  return text.replace(/\r\n|\n/g, "\r");
}

function newFrameOnActivePage(text) {
  const page = app.activeWindow.activePage;
  const [y1, x1, y2, x2] = page.bounds;
  const m = page.marginPreferences;
  const frame = page.textFrames.add({
    geometricBounds: [y1 + m.top, x1 + m.left, y2 - m.bottom, x2 - m.right],
  });
  frame.contents = text;
  return frame;
}

function insertText(text, mode) {
  if (app.documents.length === 0) throw new Error("Open a document first.");
  const sel = getSelection();
  const kind = selectionKind(sel);
  text = toInDesignText(text);

  if (mode === "frame" || !kind) {
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

// ---------- Gemini ----------

async function callGemini(prompt) {
  const key = $("apiKey").value.trim() || (await loadKey());
  if (!key) throw new Error("Add your Gemini API key in Settings.");
  const model = $("model").value.trim() || "gemini-2.5-flash";

  const res = await fetch(`${API_BASE}${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: parseFloat($("temperature").value) },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `Gemini request failed (${res.status}).`);
  }
  const candidate = data.candidates && data.candidates[0];
  const text = candidate && candidate.content && candidate.content.parts
    ? candidate.content.parts.map((p) => p.text || "").join("")
    : "";
  if (!text) {
    const reason = (candidate && candidate.finishReason) ||
      (data.promptFeedback && data.promptFeedback.blockReason) || "empty response";
    throw new Error(`Gemini returned no text (${reason}).`);
  }
  return stripMarkdown(text.trim());
}

function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1");
}

// ---------- UI actions ----------

$("generate").addEventListener("click", async () => {
  const action = $("action").value;
  const prompt = $("prompt").value.trim();
  const selected = $("useSelection").checked || action !== "generate" ? getSelectedText() : "";

  if (action !== "generate" && !selected) {
    setStatus("Select some text or a text frame first.", true);
    return;
  }
  if (action === "generate" && !prompt) {
    setStatus("Type what you want Gemini to write.", true);
    return;
  }

  $("generate").disabled = true;
  setStatus("Asking Gemini…");
  try {
    $("result").value = await callGemini(ACTIONS[action](prompt, selected));
    setStatus("Done. Review the result, then insert it.");
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    $("generate").disabled = false;
  }
});

$("insert").addEventListener("click", () => {
  const text = $("result").value;
  if (!text.trim()) {
    setStatus("Nothing to insert yet.", true);
    return;
  }
  try {
    setStatus(undoable("Insert Gemini text", () => insertText(text, $("insertMode").value)));
  } catch (e) {
    setStatus(e.message, true);
  }
});

initSettings();
