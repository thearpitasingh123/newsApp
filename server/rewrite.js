import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { fetchArticleText } from "./article.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(here, "..", "data", "readings.json");

/*
 * A "reading" is everything the story page shows, written in one AI request:
 *   full  - a detailed, neutral write-up of the article
 *   plain - the same story in simple English, following the 5-stage knowledge framework
 *   genz  - the same story in a short-form-video voice
 */

const SYSTEM = `You write the reading page of a news app. You are given one news story and return three versions of it as JSON.

Accuracy rules:
- "full", "genz", "plain.read", "plain.takeaway" and "plain.quiz" use only facts found in the source text. Never add numbers, names, dates, quotes or causes that are not there.
- "plain.understand" and "plain.connect" may also draw on well-established general background knowledge to explain context. Keep that background general: no invented specifics, no made-up statistics or quotes, and never present background as something this article reported. If you are not confident about a piece of background, leave it out.
- "plain.watch" describes things to keep an eye on. It never states a prediction as fact.
- If the source is only a short summary, keep every field proportionally short. Do not pad.

Every field is plain text with no markdown and no headings. Separate paragraphs with a blank line.`;

const INSTRUCTIONS = `Write these fields.

"full" - the full story.
A neutral, well-organised news article in your own words, about 300-450 words when the source has that much substance. Cover what happened, who is involved, the key numbers and dates, the most relevant quotes (attributed), the background the source gives, and what happens next. Lead with the most important point. Short paragraphs.

"plain" - simple English, for a curious reader with no background in the field. No jargon; if a technical term is unavoidable, explain it in a few everyday words. Short sentences. It has these parts:
- "read" (What happened?): the facts - key developments, people, companies, dates and numbers. 3-5 sentences.
- "understand" (Why did it happen?): the background, causes, how it works, who is affected and what it leads to. 3-5 sentences.
- "connect" (What does it connect to?): earlier events, the wider industry, and ideas worth knowing that this story links to. 2-4 sentences.
- "takeaway": the one sentence worth remembering.
- "quiz": exactly 3 questions that test the key facts of this story, each with a short answer found in the source.
- "care" (Why should I care?): what this means for an ordinary person - an insight or a decision it could affect. 2-3 sentences.
- "discuss": one open question that would start a good conversation about this story.
- "watch": what to keep an eye on next. 1-2 sentences.

"genz" - the story the way a sharp, funny creator would tell it in a short-form video (reels / shorts).
Open with a scroll-stopping hook. Use current internet slang and a few emojis, casually - natural, not a brand trying too hard. Short punchy lines, about 150-200 words, and keep the substance: the key facts, numbers and why it matters all survive. Humor is in the delivery, never in changing what happened. If the story involves death, violence, disaster or serious harm, keep the casual voice but drop the jokes and be respectful.`;

const PLAIN_TEXT_FIELDS = ["read", "understand", "connect", "takeaway", "care", "discuss", "watch"];

export class RewriteError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function prompt(story, sourceText, isFullArticle) {
  return `${INSTRUCTIONS}

<story>
<headline>${story.title}</headline>
<publisher>${story.source}</publisher>
<source_kind>${isFullArticle ? "full article" : "short summary only - the full article could not be read"}</source_kind>
<text>
${sourceText || "(no text beyond the headline)"}
</text>
</story>`;
}

/** Check and tidy what a model returned. Throws if the essentials are missing. */
export function normalizeReading(raw) {
  const text = (v) => (typeof v === "string" ? v.trim() : "");
  const plainIn = raw?.plain ?? {};
  const plain = {};
  for (const f of PLAIN_TEXT_FIELDS) plain[f] = text(plainIn[f]);
  plain.quiz = (Array.isArray(plainIn.quiz) ? plainIn.quiz : [])
    .map((q) => ({ question: text(q?.question), answer: text(q?.answer) }))
    .filter((q) => q.question && q.answer);
  const reading = { full: text(raw?.full), plain, genz: text(raw?.genz) };
  if (!reading.full || !reading.genz || !plain.read) {
    throw new RewriteError("The story came back incomplete. Try again.", 502);
  }
  return reading;
}

/* ---------- Providers: each takes the prompt and returns the parsed JSON ---------- */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const S = { type: "STRING" };
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    full: S,
    plain: {
      type: "OBJECT",
      properties: {
        ...Object.fromEntries(PLAIN_TEXT_FIELDS.map((f) => [f, S])),
        quiz: {
          type: "ARRAY",
          items: { type: "OBJECT", properties: { question: S, answer: S }, required: ["question", "answer"] },
        },
      },
      required: [...PLAIN_TEXT_FIELDS, "quiz"],
    },
    genz: S,
  },
  required: ["full", "plain", "genz"],
};

async function geminiWrite(userPrompt) {
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: GEMINI_SCHEMA },
      }),
    });
  } catch (error) {
    console.error("[rewrite] Gemini unreachable:", error.cause?.message || error.message);
    throw new RewriteError("The writing service couldn't be reached. Try again shortly.", 502);
  }

  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.error?.message || "";
    console.error(`[rewrite] Gemini error ${res.status}: ${detail}`);
    if (res.status === 429) {
      throw new RewriteError("The free daily quota is used up for now. Try again later (it resets overnight, US Pacific time).", 429);
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new RewriteError("The Gemini API key on the server was rejected.", 503);
    }
    if (res.status === 404) {
      throw new RewriteError(`The Gemini model "${GEMINI_MODEL}" isn't available. Set GEMINI_MODEL on the server to a current model.`, 503);
    }
    throw new RewriteError("The writing service had a problem. Try again shortly.", 502);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) {
    console.warn("[rewrite] Gemini returned no text:", data.promptFeedback?.blockReason || candidate?.finishReason);
    throw new RewriteError("This story can't be rewritten.", 422);
  }
  try {
    return JSON.parse(text);
  } catch {
    console.warn("[rewrite] Gemini returned invalid JSON, finish reason:", candidate?.finishReason);
    throw new RewriteError("The story came back garbled. Try again.", 502);
  }
}

// Claude (paid alternative).
const CLAUDE_MODEL = "claude-haiku-5-5";
const ClaudeSchema = z.object({
  full: z.string(),
  plain: z.object({
    ...Object.fromEntries(PLAIN_TEXT_FIELDS.map((f) => [f, z.string()])),
    quiz: z.array(z.object({ question: z.string(), answer: z.string() })),
  }),
  genz: z.string(),
});
let claude;

async function claudeWrite(userPrompt) {
  claude ??= new Anthropic();
  let response;
  try {
    response = await claude.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      output_config: { effort: "low", format: zodOutputFormat(ClaudeSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new RewriteError("The Claude API key on the server was rejected.", 503);
    } else if (error instanceof Anthropic.RateLimitError) {
      throw new RewriteError("Too many requests at once. Try again in a moment.", 429);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`[rewrite] Claude error ${error.status}: ${error.message}`);
      throw new RewriteError("The writing service had a problem. Try again shortly.", 502);
    }
    throw error;
  }
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new RewriteError("This story can't be rewritten.", 422);
  }
  return response.parsed_output;
}

const PROVIDERS = {
  gemini: { name: "Google Gemini", ready: () => Boolean(process.env.GEMINI_API_KEY), write: geminiWrite },
  claude: {
    name: "Claude",
    ready: () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    write: claudeWrite,
  },
};

/** The provider in use: AI_PROVIDER if set, otherwise the first one that has a key (Gemini first). */
export function activeProvider() {
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  if (forced) return PROVIDERS[forced]?.ready() ? PROVIDERS[forced] : null;
  return Object.values(PROVIDERS).find((p) => p.ready()) ?? null;
}
export const aiAvailable = () => activeProvider() !== null;

/* ---------- Saved readings ---------- */

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
    .catch((e) => console.warn("[rewrite] could not save readings:", e.message));
}

// Sample stories carry hand-written text, so the app can be tried without any key.
function sampleReading(story) {
  const [read, care = ""] = story.versions.plain.split("\n\nWhy it matters: ");
  return {
    full: story.body,
    plain: { read, understand: "", connect: "", takeaway: "", quiz: [], care, discuss: "", watch: "" },
    genz: story.versions.genz,
    basedOn: "sample",
  };
}

/**
 * Everything the story page needs. Written once per story, then served from disk.
 * `basedOn` says whether the full article could be read ("article") or only the feed's summary ("summary").
 */
export async function getReading(story, { readArticle = fetchArticleText } = {}) {
  if (story.versions) return sampleReading(story);
  if (saved[story.id]) return saved[story.id];

  const provider = activeProvider();
  if (!provider) {
    throw new RewriteError("Rewrites are switched off: no AI key is configured on the server.", 503);
  }

  // If this story is already being written (e.g. opened in two tabs), wait for that request.
  if (!inFlight.has(story.id)) {
    const job = (async () => {
      const articleText = story.url ? await readArticle(story.url) : "";
      const raw = await provider.write(prompt(story, articleText || story.body, Boolean(articleText)));
      const reading = { ...normalizeReading(raw), basedOn: articleText ? "article" : "summary" };
      saved[story.id] = reading;
      persist();
      return reading;
    })().finally(() => inFlight.delete(story.id));
    inFlight.set(story.id, job);
  }
  return inFlight.get(story.id);
}
