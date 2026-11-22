// Injected into the active tab. Returns { title, url, text, source }.
// Must be a single self-contained function (it is serialized by chrome.scripting).
export function extractArticle() {
  const selection = String(window.getSelection() || "").trim();
  if (selection.length > 200) {
    return { title: document.title, url: location.href, text: selection, source: "selection" };
  }

  const JUNK = "script,style,noscript,svg,canvas,iframe,button,nav,footer,header,aside," +
    "[role=navigation],[role=banner],[role=contentinfo],[aria-hidden=true]," +
    ".ad,.ads,.advert,.advertisement,.promo,.newsletter,.related,.comments,.share,.social,.cookie";

  const clean = (el) => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll(JUNK).forEach((n) => n.remove());
    const BLOCK = "h1,h2,h3,h4,p,li,blockquote,pre,figcaption,td";
    // Keep only outermost blocks so nested ones (a <p> inside an <li>) aren't counted twice.
    const blocks = Array.from(copy.querySelectorAll(BLOCK))
      .filter((b) => !b.parentElement || !b.parentElement.closest(BLOCK));
    let text;
    if (blocks.length) {
      text = blocks
        .map((b) => b.textContent.replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 0)
        .join("\n\n");
    } else {
      text = copy.textContent.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    }
    return text;
  };

  // 1. Obvious containers first.
  const candidates = [
    "article",
    "[itemprop=articleBody]",
    "main",
    "[role=main]",
    ".post-content", ".entry-content", ".article-body", ".article-content", "#content",
  ];
  for (const sel of candidates) {
    const els = Array.from(document.querySelectorAll(sel));
    if (!els.length) continue;
    // Pick the element with the most paragraph text.
    const best = els
      .map((el) => ({ el, text: clean(el) }))
      .sort((a, b) => b.text.length - a.text.length)[0];
    if (best.text.length > 500) {
      return { title: document.title, url: location.href, text: best.text, source: sel };
    }
  }

  // 2. Fallback: the element whose direct <p> children hold the most text.
  let bestEl = null;
  let bestScore = 0;
  document.querySelectorAll("p").forEach((p) => {
    const parent = p.parentElement;
    if (!parent) return;
    const score = Array.from(parent.children)
      .filter((c) => c.tagName === "P")
      .reduce((sum, c) => sum + c.textContent.trim().length, 0);
    if (score > bestScore) { bestScore = score; bestEl = parent; }
  });
  if (bestEl && bestScore > 300) {
    return { title: document.title, url: location.href, text: clean(bestEl), source: "paragraphs" };
  }

  // 3. Last resort: whole body.
  return { title: document.title, url: location.href, text: clean(document.body), source: "body" };
}
