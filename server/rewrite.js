import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(here, "..", "data", "rewrites.json");

export const STYLES = {
  plain: {
    label: "Plain English",
    instructions: `Rewrite this news story for a curious reader with no background in the field.
- Remove all jargon. Where a technical term is unavoidable, explain it in a few everyday words the first time it appears.
- Use short sentences and everyday comparisons where they help.
- Keep it to 2-4 short paragraphs.
- End with one line starting "Why it matters:" that says, in plain words, why an ordinary person might care.`,
  },
  genz: {
    label: "Gen Z",
    instructions: `Rewrite this news story the way a sharp, funny creator would explain it in a short-form video (reels / shorts).
- Open with a scroll-stopping hook.
- Use current internet slang and a few emojis, casually - it should sound natural, not like a brand trying too hard.
- Keep it punchy: short lines, 80-150 words total.
- Every fact must stay accurate. The humor is in the delivery, never in changing what happened.
- If the story involves death, violence, disaster or serious harm, keep the casual voice but drop the jokes and be respectful.`,
  },
};

const RULES = `You rewrite news stories in a requested style for a news-reading app.
Rules that always apply:
- Use only facts found in the source text. Never add numbers, names, quotes, causes or predictions that are not there.
- If the source is short, the rewrite is short. Do not pad it with background you were not given.
- Each rewrite is plain text: no title, no preamble, no markdown. Separate paragraphs with a blank line.`;

const storyBlock = (story) =>
  `<story>\n<headline>${story.title}</headline>\n<source>${story.source}</source>\n<text>${story.body || "(no text beyond the headline)"}</text>\n</story>`;

export class RewriteError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/* ---------- Providers ----------
 * Each provider takes a story and the style that was asked for, and returns
 * { style: text } for one or more styles. Everything returned is saved.
 */

// Google Gemini (free tier). One request writes every style at once, so each
// story uses the daily free quota only once.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

async function geminiRewrite(story) {
  const styleIds = Object.keys(STYLES);
  const prompt =
    `Rewrite the news story below in ${styleIds.length} styles. Return one JSON field per style.\n\n` +
    styleIds.map((id) => `Style "${id}":\n${STYLES[id].instructions}`).join("\n\n") +
    `\n\n${storyBlock(story)}`;

  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: RULES }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: Object.fromEntries(styleIds.map((id) => [id, { type: "STRING" }])),
            required: styleIds,
          },
        },
      }),
    });
  } catch (error) {
    console.error("[rewrite] Gemini unreachable:", error.cause?.message || error.message);
    throw new RewriteError("The rewrite service couldn't be reached. Try again shortly.", 502);
  }

  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.error?.message || "";
    console.error(`[rewrite] Gemini error ${res.status}: ${detail}`);
    if (res.status === 429) {
      throw new RewriteError("The free rewrite quota is used up for now. Try again later (the daily quota resets overnight, US Pacific time).", 429);
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new RewriteError("The Gemini API key on the server was rejected.", 503);
    }
    if (res.status === 404) {
      throw new RewriteError(`The Gemini model "${GEMINI_MODEL}" isn't available. Set GEMINI_MODEL on the server to a current model.`, 503);
    }
    throw new RewriteError("The rewrite service had a problem. Try again shortly.", 502);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) {
    console.warn("[rewrite] Gemini returned no text:", data.promptFeedback?.blockReason || candidate?.finishReason);
    throw new RewriteError("This story can't be rewritten.", 422);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new RewriteError("The rewrite came back garbled. Try again.", 502);
  }
  const out = {};
  for (const id of styleIds) {
    if (typeof parsed[id] === "string" && parsed[id].trim()) out[id] = parsed[id].trim();
  }
  return out;
}

// Claude (paid). One request per style, made only when that tab is opened.
const CLAUDE_MODEL = "claude-haiku-5-5";
let claude;

async function claudeRewrite(story, style) {
  claude ??= new Anthropic();
  let response;
  try {
    response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      output_config: { effort: "low" },
      system: RULES,
      messages: [{ role: "user", content: `${STYLES[style].instructions}\n\n${storyBlock(story)}` }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new RewriteError("The Claude API key on the server was rejected.", 503);
    } else if (error instanceof Anthropic.RateLimitError) {
      throw new RewriteError("Too many rewrites at once. Try again in a moment.", 429);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`[rewrite] Claude error ${error.status}: ${error.message}`);
      throw new RewriteError("The rewrite service had a problem. Try again shortly.", 502);
    }
    throw error;
  }
  if (response.stop_reason === "refusal") {
    throw new RewriteError("This story can't be rewritten in that style.", 422);
  }
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
  return text ? { [style]: text } : {};
}

const PROVIDERS = {
  gemini: { name: "Google Gemini", ready: () => Boolean(process.env.GEMINI_API_KEY), rewrite: geminiRewrite },
  claude: {
    name: "Claude",
    ready: () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    rewrite: claudeRewrite,
  },
};

/** The provider in use: AI_PROVIDER if set, otherwise the first one that has a key (Gemini first). */
export function activeProvider() {
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  if (forced) return PROVIDERS[forced]?.ready() ? PROVIDERS[forced] : null;
  return Object.values(PROVIDERS).find((p) => p.ready()) ?? null;
}
export const aiAvailable = () => activeProvider() !== null;

/* ---------- Saved rewrites ---------- */

let saved = {};
try {
  saved = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
} catch {
  // nothing saved yet
}
const inFlight = new Map();

function persist() {
  fs.promises
    .mkdir(path.dirname(CACHE_FILE), { recursive: true })
    .then(() => fs.promises.writeFile(CACHE_FILE, JSON.stringify(saved)))
    .catch((e) => console.warn("[rewrite] could not save rewrites:", e.message));
}

export async function rewriteStory(story, style) {
  if (!STYLES[style]) throw new RewriteError(`Unknown style "${style}"`, 404);

  // Sample stories ship with hand-written versions, so the app can be tried without any key.
  if (story.versions?.[style]) return story.versions[style];

  const key = `${story.id}:${style}`;
  if (saved[key]) return saved[key];

  const provider = activeProvider();
  if (!provider) {
    throw new RewriteError("Rewrites are switched off: no AI key is configured on the server.", 503);
  }

  // If the same story is already being rewritten (e.g. both tabs opened quickly), wait for that request.
  const flightKey = provider.rewrite === geminiRewrite ? story.id : key;
  if (!inFlight.has(flightKey)) {
    inFlight.set(
      flightKey,
      provider.rewrite(story, style).finally(() => inFlight.delete(flightKey)),
    );
  }
  const result = await inFlight.get(flightKey);

  for (const [id, text] of Object.entries(result)) saved[`${story.id}:${id}`] = text;
  persist();
  if (!saved[key]) throw new RewriteError("The rewrite came back empty. Try again.", 502);
  return saved[key];
}
