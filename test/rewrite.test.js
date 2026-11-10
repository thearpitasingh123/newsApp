import test from "node:test";
import assert from "node:assert/strict";

process.env.GEMINI_API_KEY = "test-key";
delete process.env.AI_PROVIDER;
const { rewriteStory, activeProvider, RewriteError } = await import("../server/rewrite.js");

const realFetch = globalThis.fetch;
const story = (id) => ({ id, title: "Bank holds rates", source: "Test", body: "The bank held rates." });
const reply = (status, body) => new Response(JSON.stringify(body), { status });

test("Gemini: one request writes both styles and the second tab is free", async (t) => {
  t.after(() => (globalThis.fetch = realFetch));
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return reply(200, { candidates: [{ content: { parts: [{ text: JSON.stringify({ plain: "Plain text.", genz: "no cap 💅" }) }] } }] });
  };
  assert.equal(activeProvider().name, "Google Gemini");
  const id = `t-${Date.now()}`;
  assert.equal(await rewriteStory(story(id), "plain"), "Plain text.");
  assert.equal(await rewriteStory(story(id), "genz"), "no cap 💅");
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /models\/gemini-flash-lite-latest:generateContent$/);
  assert.equal(calls[0].init.headers["x-goog-api-key"], "test-key");
  assert.match(JSON.parse(calls[0].init.body).contents[0].parts[0].text, /Bank holds rates/);
});

test("Gemini: running out of free quota gives a clear message", async (t) => {
  t.after(() => (globalThis.fetch = realFetch));
  globalThis.fetch = async () => reply(429, { error: { message: "quota" } });
  await assert.rejects(rewriteStory(story(`q-${Date.now()}`), "plain"), (e) => e instanceof RewriteError && e.status === 429 && /quota/.test(e.message));
});
