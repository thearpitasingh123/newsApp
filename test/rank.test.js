import test from "node:test";
import assert from "node:assert/strict";
import { rankStories } from "../server/news.js";

const now = Date.now();
const article = (i, over = {}) => ({
  id: `a${i}`, sectorId: "tech", title: `Completely distinct headline number${i} topic${i}`,
  body: "text", url: `https://example.com/${i}`, source: "A", publishedAt: now - i * 3600000, sample: false, ...over,
});

test("never returns more than 10 stories", () => {
  const out = rankStories(Array.from({ length: 40 }, (_, i) => article(i)), 10, now);
  assert.equal(out.length, 10);
});

test("merges the same event from different outlets and ranks it first", () => {
  const out = rankStories([
    article(1),
    article(5, { title: "Central bank holds interest rates steady", source: "A" }),
    article(6, { title: "Central bank holds interest rates steady again", source: "B", url: "https://b.example/1" }),
  ], 10, now);
  assert.equal(out.length, 2);
  assert.equal(out[0].sources.length, 2);
});
