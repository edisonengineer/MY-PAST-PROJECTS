# Article Summarizer (browser extension)

Summarize the article you're reading with one click. **Free by default, with no account or API key needed.**

## Download & install (load unpacked)

1. On this GitHub page click **Code → Download ZIP**, then unzip it somewhere you'll keep it.
   (Or: `git clone https://github.com/edisonengineer/article-summarizer-extension`)
2. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the unzipped folder (the one containing `manifest.json`).
5. Pin it from the puzzle-piece menu so the icon stays in the toolbar.

Don't delete the folder afterwards: the browser loads the extension from it.

## Use

- Open an article, click the icon (or press **Alt+Shift+S**), then **Summarize**.
- Choose **Short / Medium / Detailed**.
- **Select text first** to summarize only that part.
- **Copy** puts the summary on the clipboard; **Regenerate** makes a fresh one.

## Summarizer engines (⚙ Settings)

| Engine | Cost | Needs | Quality |
|---|---|---|---|
| **Free: Chrome built-in AI** (default) | Free | Recent desktop Chrome on a fairly powerful computer; downloads its model once | Good: real AI summary, runs on your computer, nothing leaves the browser |
| **Free: Offline** | Free | Nothing (works in every browser, even without internet) | Basic: picks the article's most important sentences |
| **Claude API** | Paid per use | An Anthropic API key from console.anthropic.com | Best |

The default "Free" setting uses Chrome's built-in AI when your browser supports it, and
switches to Offline mode automatically when it doesn't (for example in Edge or Brave, or on older computers).
The popup always says which engine it used.

## Privacy

- Chrome built-in AI and Offline mode: page text never leaves your computer.
- Claude API: page text is sent to `api.anthropic.com` only when you click Summarize. Your key stays in local extension storage.
- The extension uses `activeTab`, so it can only read the tab you clicked it on.

## Files

| File | What it does |
|---|---|
| `manifest.json` | Extension config (Manifest V3) |
| `popup.html/.css/.js` | The toolbar popup; picks the engine |
| `extract.js` | Finds the article text on the page |
| `chrome-ai.js` | Free on-device summaries (Chrome built-in Summarizer API) |
| `offline.js` | Free key-sentence summaries, no AI |
| `claude.js` | Claude API (optional) |
| `options.html/.js`, `settings.js` | Settings page and storage |

After editing any file, click ↻ on the extension's card in `chrome://extensions`.
