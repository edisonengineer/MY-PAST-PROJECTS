# Gemini Writer for Adobe InDesign

A UXP panel plugin that uses Google Gemini to write and edit text directly inside InDesign.

## What it does

- **Write new text** from a prompt (optionally using the selected text as context)
- **Rewrite, shorten, expand, proofread, translate** the selected text
- **Headline ideas** for the selected story
- Preview and edit the result in the panel, then insert it:
  - replace the selection / insert at the text cursor
  - insert after the selection
  - place it in a new text frame on the active page (also used when nothing is selected)
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

## Changing the model

Type any Gemini model id in Settings (default `gemini-3.8-flash`; or a Pro model for higher quality. If Google retires the model you set, the plugin switches to the replacement Google names in its error). See https://ai.google.dev/gemini-api/docs/models for current ids.

## Packaging for others

In UXP Developer Tool, use ••• → **Package** to create a `.ccx` file. Double-click it on another machine to install via Creative Cloud.

## Files

- `manifest.json` – UXP manifest (host `ID`, network permission for the Gemini API)
- `index.html`, `styles.css` – panel UI
- `main.js` – Gemini API call and InDesign text insertion
