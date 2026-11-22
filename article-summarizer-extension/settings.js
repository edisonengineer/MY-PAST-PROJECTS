export const DEFAULTS = {
  // "free" = Chrome built-in AI, falling back to offline; "offline"; or "claude" (needs an API key).
  provider: "free",
  apiKey: "",
  model: "claude-opus-5-5",
  length: "medium",
  language: "",
};

export async function loadSettings() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...stored };
}

export async function saveSettings(values) {
  await chrome.storage.local.set(values);
}
