import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(here, "..", "data", "rewrites.json");
const MODEL = "claude-opus-5-5";

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

const SYSTEM = `You rewrite news stories in a requested style for a news-reading app.
Rules that always apply:
- Use only facts found in the source text. Never add numbers, names, quotes, causes or predictions that are not there.
- If the source is short, the rewrite is short. Do not pad it with background you were not given.
- Output only the rewritten story as plain text: no title, no preamble, no markdown.`;

let memory = {};
try {
  memory = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
} catch {
  // no saved rewrites yet
}

let client;
export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export class RewriteError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function rewriteStory(story, style) {
  const spec = STYLES[style];
  if (!spec) throw new RewriteError(`Unknown style "${style}"`, 404);

  // Sample stories ship with hand-written versions, so the app can be tried without an API key.
  if (story.versions?.[style]) return story.versions[style];

  const key = `${story.id}:${style}`;
  if (memory[key]) return memory[key];

  if (!aiAvailable()) {
    throw new RewriteError("AI rewrites are switched off: no Claude API key is configured on the server.", 503);
  }
  client ??= new Anthropic();

  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // if the model declines, the API retries on a fallback model
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `${spec.instructions}\n\n<story>\n<headline>${story.title}</headline>\n<source>${story.source}</source>\n<text>${story.body || "(no text beyond the headline)"}</text>\n</story>`,
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new RewriteError("The Claude API key on the server was rejected.", 503);
    } else if (error instanceof Anthropic.RateLimitError) {
      throw new RewriteError("Too many rewrites at once. Try again in a moment.", 429);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`[rewrite] API error ${error.status}: ${error.message}`);
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
  if (!text) throw new RewriteError("The rewrite came back empty. Try again.", 502);

  memory[key] = text;
  fs.promises
    .mkdir(path.dirname(CACHE_FILE), { recursive: true })
    .then(() => fs.promises.writeFile(CACHE_FILE, JSON.stringify(memory)))
    .catch((e) => console.warn("[rewrite] could not save cache:", e.message));
  return text;
}
