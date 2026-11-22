# Article Summarizer (browser extension)

Summarize the article you're reading with one click, powered by Claude.

## Install (load unpacked)

1. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick this `article-summarizer-extension` folder.
4. Pin the extension from the puzzle-piece menu so the icon stays in the toolbar.
5. Click the icon → ⚙ (or right-click the icon → *Options*), paste your Anthropic API key
   (from https://console.anthropic.com/settings/keys) and click **Save**.

## Use

- Open any article and click the icon (or press **Alt+Shift+S**), then **Summarize**.
- Pick **Short / Medium / Detailed** from the dropdown.
- **Select text first** to summarize only that part (handy on pages where auto-detection grabs the wrong thing).
- The summary streams in as it's written. **Copy** puts it on the clipboard; **Regenerate** makes a fresh one.
- Summaries are remembered per page until you close the browser.

Note: the popup closes if you click outside it, which cancels a summary that's still being written.

## Settings

| Setting | Default | Notes |
|---|---|---|
| Model | Claude Opus 5.5 | Sonnet 5.5 and Haiku 5.5 are faster and cheaper |
| Length | Medium | TL;DR + key points |
| Language | (blank) | Blank = same language as the article; or type e.g. `English` |

## Privacy

- Your API key is saved in the browser's local extension storage, never synced.
- Page text is sent only to `api.anthropic.com`, and only when you click **Summarize**.
- The extension uses `activeTab`, so it can only read the tab you clicked it on.

## Files

| File | What it does |
|---|---|
| `manifest.json` | Extension config (Manifest V3) |
| `popup.html/.css/.js` | The toolbar popup |
| `extract.js` | Finds the article text on the page |
| `claude.js` | Calls the Claude API and streams the reply |
| `options.html/.js` | Settings page |
| `settings.js` | Loads/saves settings |

After editing any file, click the ↻ reload button on the extension's card in `chrome://extensions`.
