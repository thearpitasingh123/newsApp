import crypto from "node:crypto";
import Parser from "rss-parser";
import { SECTORS, MAX_STORIES_PER_SECTOR } from "./sectors.js";
import { SAMPLE_STORIES } from "./sample.js";

const parser = new Parser();
const CACHE_MS = 15 * 60 * 1000;
const FEED_TIMEOUT_MS = 8000;

const cache = new Map(); // sectorId -> { at, stories }
const storiesById = new Map();

const STOPWORDS = new Set(
  "a an the of to in on for and or but with at by from as is are was were be been it its this that after over into new says say said will has have had not no up out about than amid".split(" "),
);

function titleTokens(title) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

function similarity(a, b) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

function cleanText(text = "") {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/Continue reading\.\.\.\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Group articles about the same event, rank the groups, and keep the top N.
 * A story covered by more outlets ranks higher; newer stories rank higher.
 */
export function rankStories(articles, limit = MAX_STORIES_PER_SECTOR, now = Date.now()) {
  const clusters = [];
  for (const article of articles) {
    const tokens = titleTokens(article.title);
    const match = clusters.find((c) => similarity(c.tokens, tokens) >= 0.5);
    if (match) match.articles.push(article);
    else clusters.push({ tokens, articles: [article] });
  }

  const stories = clusters.map(({ articles: group }) => {
    // The article with the fullest text represents the story.
    const lead = [...group].sort((a, b) => b.body.length - a.body.length)[0];
    const sources = [];
    for (const a of group) {
      if (!sources.some((s) => s.name === a.source)) sources.push({ name: a.source, url: a.url });
    }
    const publishedAt = Math.max(...group.map((a) => a.publishedAt));
    const hoursOld = Math.max(0, (now - publishedAt) / 3600000);
    const score = sources.length * 2 + Math.max(0, 1 - hoursOld / 48) * 3;
    return { ...lead, publishedAt, sources, score };
  });

  return stories.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function fetchFeed(sectorId, feed) {
  const res = await fetch(feed.url, {
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    headers: { "user-agent": "news-reader/0.1" },
  });
  if (!res.ok) throw new Error(`${feed.url} responded ${res.status}`);
  const parsed = await parser.parseString(await res.text());
  return parsed.items
    .filter((item) => item.title && item.link)
    .map((item) => ({
      id: crypto.createHash("sha1").update(item.link).digest("hex").slice(0, 12),
      sectorId,
      title: cleanText(item.title),
      body: cleanText(item.contentSnippet || item.content || item.summary || ""),
      url: item.link,
      source: feed.source,
      publishedAt: item.isoDate ? Date.parse(item.isoDate) : Date.now(),
      sample: false,
    }));
}

function sampleFor(sectorId) {
  return SAMPLE_STORIES.filter((s) => s.sectorId === sectorId).map((s) => ({
    ...s,
    sources: [{ name: s.source, url: null }],
  }));
}

/** Up to 10 ranked stories for a sector. Falls back to sample stories when no feed is reachable. */
export async function getSectorStories(sectorId) {
  const sector = SECTORS.find((s) => s.id === sectorId);
  if (!sector) return null;

  const hit = cache.get(sectorId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.stories;

  const results = await Promise.allSettled(sector.feeds.map((f) => fetchFeed(sectorId, f)));
  const articles = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  let stories;
  if (articles.length > 0) {
    stories = rankStories(articles);
  } else {
    const reason = results.find((r) => r.status === "rejected")?.reason;
    console.warn(`[news] ${sectorId}: no feed reachable, using sample stories (${reason?.cause?.message || reason?.message})`);
    stories = sampleFor(sectorId);
  }

  // Sample results are retried sooner, so live news appears once feeds are reachable.
  const at = articles.length > 0 ? Date.now() : Date.now() - CACHE_MS + 60000;
  cache.set(sectorId, { at, stories });
  for (const s of stories) storiesById.set(s.id, s);
  return stories;
}

export function getStory(id) {
  return storiesById.get(id) ?? null;
}
