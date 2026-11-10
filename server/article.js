import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const TIMEOUT_MS = 12000;
const MIN_USEFUL_CHARS = 600; // shorter than this is a teaser, a video page or a cookie wall
const MAX_CHARS = 40000; // about 6,500 words; longer articles are cut at a paragraph break

/** Pull the readable article text out of a page of HTML. Returns "" if there isn't a real article in it. */
export function extractArticleText(html) {
  const { document } = parseHTML(html);
  const article = new Readability(document).parse();
  const text = (article?.textContent || "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
  if (text.length < MIN_USEFUL_CHARS) return "";
  if (text.length <= MAX_CHARS) return text;
  const cut = text.lastIndexOf("\n\n", MAX_CHARS);
  return text.slice(0, cut > 0 ? cut : MAX_CHARS);
}

/** Fetch a story's page and return its article text, or "" if it can't be read. */
export async function fetchArticleText(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; news-reader/0.1)", accept: "text/html" },
    });
    if (!res.ok) throw new Error(`responded ${res.status}`);
    return extractArticleText(await res.text());
  } catch (error) {
    console.warn(`[article] could not read ${url}: ${error.cause?.message || error.message}`);
    return "";
  }
}
