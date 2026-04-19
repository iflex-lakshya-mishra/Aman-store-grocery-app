/**
 * Search / fuzzy match helpers (typo-tolerant, few keystrokes).
 */

export const normalizeSearchQuery = (q) =>
  String(q || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Bounded Levenshtein for short strings (perf-safe). */
export const levenshtein = (a, b) => {
  const s = String(a);
  const t = String(b);
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  if (s.length > 32 || t.length > 32) {
    return s === t ? 0 : 99;
  }
  const m = s.length;
  const n = t.length;
  const row = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) row[j] = j;
  for (let i = 1; i <= m; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const tmp = row[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
};

/** All chars of needle appear in order in haystack (handles missing letters). */
export const isLooseSubsequence = (needle, haystack) => {
  const n = needle.replace(/\s/g, '');
  const h = haystack.replace(/\s/g, '');
  if (!n.length) return true;
  let i = 0;
  for (let j = 0; j < h.length && i < n.length; j += 1) {
    if (h[j] === n[i]) i += 1;
  }
  return i === n.length;
};

/**
 * Higher = better match. Used for suggestions + results ranking.
 */
export const scoreProductMatch = (query, product) => {
  const q = normalizeSearchQuery(query);
  if (!q) return 0;

  const name = String(product.name || '').toLowerCase();
  const cat = String(product.category || '').toLowerCase();
  const pack = String(product.size || product.pack_size || '').toLowerCase();
  const hay = `${name} ${cat} ${pack}`;

  let score = 0;

  if (hay.includes(q)) {
    score += 1000;
    const idx = hay.indexOf(q);
    score -= Math.min(idx, 50);
  }

  const hayWords = hay.split(/[^a-z0-9]+/).filter((w) => w.length > 0);
  const qWords = q.split(' ').filter(Boolean);

  for (const qw of qWords) {
    if (qw.length < 1) continue;
    for (const w of hayWords) {
      if (!w.length) continue;
      if (w === qw) {
        score += 400;
        continue;
      }
      if (w.startsWith(qw)) {
        score += 320;
        continue;
      }
      if (qw.length >= 2 && w.includes(qw)) {
        score += 200;
        continue;
      }
      if (qw.length >= 3) {
        const slice = w.length > 28 ? w.slice(0, 28) : w;
        const d = levenshtein(qw, slice);
        if (d === 1) score += 160;
        else if (d === 2 && qw.length >= 4) score += 100;
        else if (d === 2 && qw.length === 3) score += 55;
      }
    }
  }

  if (score < 500 && q.length >= 2 && isLooseSubsequence(q, name)) {
    score += 120;
  }

  const qCompact = q.replace(/[^a-z0-9]/g, '');
  const nameCompact = name.replace(/[^a-z0-9]/g, '');
  if (qCompact.length >= 3 && nameCompact.includes(qCompact)) {
    score += 80;
  }

  return score;
};

export const rankProductsByQuery = (products, query) => {
  const q = normalizeSearchQuery(query);
  if (!q || !Array.isArray(products)) return [];
  return products
    .map((p) => ({ product: p, score: scoreProductMatch(q, p) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
};

export const getSearchSuggestions = (products, query, { limit = 8, minScore = 1 } = {}) => {
  const ranked = rankProductsByQuery(products, query);
  return ranked.filter((x) => x.score >= minScore).slice(0, limit);
};
