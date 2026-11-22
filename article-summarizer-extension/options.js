import { loadSettings, saveSettings } from "./settings.js";

const fields = ["provider", "apiKey", "model", "length", "language"];
const $ = (id) => document.getElementById(id);

(async () => {
  const s = await loadSettings();
  for (const f of fields) $(f).value = s[f];
  toggleClaude();
})();

function toggleClaude() {
  $("claudeBox").hidden = $("provider").value !== "claude";
}
$("provider").addEventListener("change", toggleClaude);

$("save").addEventListener("click", async () => {
  const values = Object.fromEntries(fields.map((f) => [f, $(f).value.trim()]));
  await saveSettings(values);
  $("saved").textContent = values.provider === "claude" && !values.apiKey
    ? "Saved — add an API key to use Claude." : "Saved.";
  setTimeout(() => ($("saved").textContent = ""), 2500);
});
