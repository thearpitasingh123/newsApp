import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { fetchFeed } from "../server/news.js";

const RSS = `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title>
<item><title>Rates held &amp; markets rise</title><link>https://example.com/a</link>
<description>&lt;p&gt;The bank held rates.&lt;/p&gt;</description><pubDate>Mon, 09 Nov 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`;

test("reads a feed into clean articles", async () => {
  const server = http.createServer((_, res) => res.end(RSS)).listen(0);
  try {
    const [a] = await fetchFeed("business", { source: "Test", url: `http://localhost:${server.address().port}/rss` });
    assert.equal(a.title, "Rates held & markets rise");
    assert.equal(a.body, "The bank held rates.");
    assert.equal(a.url, "https://example.com/a");
    assert.equal(a.publishedAt, Date.parse("2026-11-09T10:00:00Z"));
  } finally {
    server.close();
  }
});
