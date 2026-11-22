import { loadSettings, saveSettings } from "./settings.js";

const fields = ["apiKey", "model", "length", "language"];
const $ = (id) => document.getElementById(id);

(async () => {
  const s = await loadSettings();
  for (const f of fields) $(f).value = s[f];
})();

$("save").addEventListener("click", async () => {
  const values = Object.fromEntries(fields.map((f) => [f, $(f).value.trim()]));
  await saveSettings(values);
  $("saved").textContent = values.apiKey ? "Saved." : "Saved — add an API key to start summarizing.";
  setTimeout(() => ($("saved").textContent = ""), 2500);
});
