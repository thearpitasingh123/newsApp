import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-key";
delete process.env.AI_PROVIDER;
const { getReading, normalizeReading, activeProvider, RewriteError } = await import("../server/rewrite.js");

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

test("one request writes all three tabs from every outlet's feed summary, and reopening is free", async (t) => {
  t.after(() => (globalThis.fetch = realFetch));
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return gemini(good);
  };
  assert.equal(activeProvider().name, "Google Gemini");
  const s = {
    ...story(`t-${Date.now()}`),
    summaries: [
      { source: "BBC", text: "The bank held rates at 5.25%." },
      { source: "NPR", text: "Inflation is still 3.1%." },
    ],
  };
  const [a, b] = await Promise.all([getReading(s), getReading(s)]);
  const again = await getReading(s);
  assert.equal(calls.length, 1, "only one request, and nothing fetched from publishers' sites");
  assert.equal(a.full, "Full write-up.");
  assert.deepEqual(a.plain.quiz, [{ question: "Q1?", answer: "A1" }]);
  assert.equal(b.genz, again.genz);
  assert.match(calls[0].url, /models\/gemini-flash-lite-latest:generateContent$/);
  assert.equal(calls[0].init.headers["x-goog-api-key"], "test-key");
  const sent = JSON.parse(calls[0].init.body).contents[0].parts[0].text;
  assert.match(sent, /<summary outlet="BBC">The bank held rates at 5.25%.<\/summary>/);
  assert.match(sent, /<summary outlet="NPR">Inflation is still 3.1%.<\/summary>/);
});

test("running out of free quota gives a clear message", async (t) => {
  t.after(() => (globalThis.fetch = realFetch));
  globalThis.fetch = async () => reply(429, { error: { message: "quota" } });
  await assert.rejects(
    getReading(story(`q-${Date.now()}`)),
    (e) => e instanceof RewriteError && e.status === 429 && /quota/.test(e.message),
  );
});

test("an incomplete reply is rejected rather than shown", () => {
  assert.throws(() => normalizeReading({ full: "x", plain: {}, genz: "y" }), RewriteError);
});
