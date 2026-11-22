// Free summaries that work in every browser with no AI and no internet:
// picks the most important sentences from the article itself (extractive summary).

const STOPWORDS = new Set((
  "a about above after again against all am an and any are as at be because been before being below " +
  "between both but by can could did do does doing down during each few for from further had has have " +
  "having he her here hers herself him himself his how i if in into is it its itself just me more most " +
  "my myself no nor not now of off on once only or other our ours ourselves out over own same she should " +
  "so some such than that the their theirs them themselves then there these they this those through to " +
  "too under until up very was we were what when where which while who whom why will with would you your " +
  "yours yourself yourselves also said says one two new like get got make made many much may might must " +
  "us via per its it's i'm we're they're don't doesn't can't won't"
).split(/\s+/));

const COUNTS = { short: 3, medium: 6, detailed: 10 };

function sentencesOf(text) {
  const out = [];
  for (const para of text.split(/\n+/)) {
    const parts = para.match(/[^.!?。！？]+[.!?。！？]+["'”’)\]]*|[^.!?。！？]+$/g) || [];
    for (const s of parts) {
      const t = s.trim();
      if (t.split(/\s+/).length >= 6 && t.length <= 600) out.push(t);
    }
  }
  return out;
}

function words(s) {
  return (s.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []).filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function summarizeOffline(article, length = "medium") {
  const sentences = sentencesOf(article.text);
  if (sentences.length === 0) return "Couldn't find enough sentences on this page to summarize.";

  const freq = new Map();
  for (const s of sentences) for (const w of words(s)) freq.set(w, (freq.get(w) || 0) + 1);
  const titleWords = new Set(words(article.title || ""));
  const max = Math.max(1, ...freq.values());

  const scored = sentences.map((s, i) => {
    const ws = words(s);
    if (!ws.length) return { s, i, score: 0 };
    let score = ws.reduce((sum, w) => sum + (freq.get(w) || 0) / max + (titleWords.has(w) ? 0.5 : 0), 0);
    score /= Math.sqrt(ws.length); // don't just favour long sentences
    if (i < 3) score *= 1.4; // the opening usually states the main point
    if (/\d/.test(s)) score *= 1.1; // facts and figures
    return { s, i, score };
  });

  const n = Math.min(COUNTS[length] || COUNTS.medium, sentences.length);
  const picked = [];
  for (const cand of [...scored].sort((a, b) => b.score - a.score)) {
    if (picked.length >= n) break;
    // Skip near-duplicates of sentences already picked.
    const cw = new Set(words(cand.s));
    const dup = picked.some((p) => {
      const pw = words(p.s);
      const overlap = pw.filter((w) => cw.has(w)).length;
      return overlap / Math.max(1, Math.min(pw.length, cw.size)) > 0.7;
    });
    if (!dup) picked.push(cand);
  }
  picked.sort((a, b) => a.i - b.i);
  return picked.map((p) => `- ${p.s}`).join("\n");
}
