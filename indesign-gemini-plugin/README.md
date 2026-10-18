# Gemini Writer for Adobe InDesign

A UXP panel plugin that uses Google Gemini to write and edit text, and generate images, directly inside InDesign.

## What it does

- **Write new text** from a prompt (optionally using the selected text as context)
- **Rewrite, shorten, expand, proofread, translate** the selected text
- **Headline ideas** for the selected story
- Preview and edit the result in the panel, then insert it:
  - replace the selection / insert at the text cursor
  - insert after the selection
  - place it in a new text frame on the active page (also used when nothing is selected)
- **Image tab:** generate an image from a description and place it in the selected graphic frame (filled and centered) or a new frame on the page. Shape can match the selected frame. Images are embedded by default; files are kept in the plugin's data folder.
- Each insert is a single undo step (Ctrl/Cmd+Z)

## Requirements

- InDesign 2023 (v18.5) or later
- A Gemini API key from https://aistudio.google.com/apikey
- [UXP Developer Tool](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/) (install from Creative Cloud) for loading during development

## Load it in InDesign (development)

1. Open InDesign.
2. Open **UXP Developer Tool** → **Add Plugin** → select `manifest.json` in this folder.
3. Click **Load** (••• menu → *Load*). The panel appears under **Window → Gemini Writer** (or **Plugins → Gemini Writer**).
4. Open **Settings** in the panel, paste your API key, and click **Save settings**.

The key is kept in UXP secure storage on your machine and only sent to `generativelanguage.googleapis.com`.

## Usage

1. Click into a text frame (or select text / a text frame).
2. Pick an action, type instructions, click **Generate**.
3. Edit the result if needed, choose an insert mode, click **Insert into document**.

For **Translate**, put the target language in the instructions box (e.g. `Swahili`).

## Speed

Gemini 3 models "think" before answering, which is slow by default. **Settings → Speed** controls this: *Fastest* (default) for everyday copy, *Best quality* for harder writing.

## Image generation and the free tier

Image models may have no free API allowance. If you see "Image limit reached", the key needs billing turned on (or try later). Default image model: `gemini-3.1-flash-image`; the plugin falls back to `gemini-3.1-flash-image-preview` and `gemini-2.5-flash-image` if it isn't available.

## Changing the model

Type any Gemini model id in Settings (default `gemini-3.8-flash`; or a Pro model for higher quality. If Google retires the model you set, the plugin switches to the replacement Google names in its error). See https://ai.google.dev/gemini-api/docs/models for current ids.

## Packaging for others

In UXP Developer Tool, use ••• → **Package** to create a `.ccx` file. Double-click it on another machine to install via Creative Cloud.

## Files

- `manifest.json` – UXP manifest (host `ID`, network permission for the Gemini API)
- `index.html`, `styles.css` – panel UI
- `main.js` – Gemini API call and InDesign text insertion
