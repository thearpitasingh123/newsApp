import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-key";
delete process.env.AI_PROVIDER;
const { getReading, normalizeReading, activeProvider, RewriteError } = await import("../server/rewrite.js");
const { extractArticleText } = await import("../server/article.js");

const realFetch = globalThis.fetch;
const story = (id) => ({ id, title: "Bank holds rates", source: "Test", url: "https://example.test/a", body: "The bank held rates." });
const reply = (status, body) => new Response(JSON.stringify(body), { status });
const good = {
  full: "Full write-up.",
  plain: {
    read: "It happened.", understand: "Because.", connect: "Links.", takeaway: "Remember this.",
    quiz: [{ question: "Q1?", answer: "A1" }, { question: "", answer: "dropped" }],
    care: "It matters.", discuss: "What do you think?", watch: "Next meeting.",
  },
  genz: "no cap 💅",
};
const gemini = (body) => reply(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }] });

test("one request writes all three tabs from the full article, and reopening is free", async (t) => {
  t.after(() => (globalThis.fetch = realFetch));
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return gemini(good);
  };
  assert.equal(activeProvider().name, "Google Gemini");
  const s = story(`t-${Date.now()}`);
  const readArticle = async () => "FULL ARTICLE TEXT about the bank.";
  const [a, b] = await Promise.all([getReading(s, { readArticle }), getReading(s, { readArticle })]);
  const again = await getReading(s, { readArticle });
  assert.equal(calls.length, 1);
  assert.equal(a.full, "Full write-up.");
  assert.equal(a.basedOn, "article");
  assert.deepEqual(a.plain.quiz, [{ question: "Q1?", answer: "A1" }]);
  assert.equal(b.genz, again.genz);
  assert.match(calls[0].url, /models\/gemini-flash-lite-latest:generateContent$/);
  assert.equal(calls[0].init.headers["x-goog-api-key"], "test-key");
  const sent = JSON.parse(calls[0].init.body).contents[0].parts[0].text;
  assert.match(sent, /FULL ARTICLE TEXT/);
  assert.match(sent, /<source_kind>full article</);
});

test("falls back to the feed summary when the article can't be read", async (t) => {
  t.after(() => (globalThis.fetch = realFetch));
  let sent;
  globalThis.fetch = async (_, init) => ((sent = JSON.parse(init.body).contents[0].parts[0].text), gemini(good));
  const r = await getReading(story(`s-${Date.now()}`), { readArticle: async () => "" });
  assert.equal(r.basedOn, "summary");
  assert.match(sent, /The bank held rates\./);
  assert.match(sent, /short summary only/);
});

test("running out of free quota gives a clear message", async (t) => {
  t.after(() => (globalThis.fetch = realFetch));
  globalThis.fetch = async () => reply(429, { error: { message: "quota" } });
  await assert.rejects(
    getReading(story(`q-${Date.now()}`), { readArticle: async () => "" }),
    (e) => e instanceof RewriteError && e.status === 429 && /quota/.test(e.message),
  );
});

test("an incomplete reply is rejected rather than shown", () => {
  assert.throws(() => normalizeReading({ full: "x", plain: {}, genz: "y" }), RewriteError);
});

test("extracts article text from a page and ignores pages with no real article", () => {
  const para = "The central bank kept its main interest rate unchanged on Thursday, saying inflation was still above target. ";
  const html = `<html><head><title>Rates</title></head><body><nav>Home | World | Business</nav>
    <article><h1>Bank holds rates</h1>${Array.from({ length: 8 }, (_, i) => `<p>${para}Paragraph ${i}.</p>`).join("")}</article>
    <footer>Cookie settings</footer></body></html>`;
  const text = extractArticleText(html);
  assert.match(text, /Paragraph 7\./);
  assert.doesNotMatch(text, /Cookie settings/);
  assert.equal(extractArticleText("<html><body><p>Watch the video.</p></body></html>"), "");
});
