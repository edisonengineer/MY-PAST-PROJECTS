export const DEFAULTS = {
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
