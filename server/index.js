import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { SECTORS, MAX_STORIES_PER_SECTOR } from "./sectors.js";
import { getSectorStories, getStory } from "./news.js";
import { getReading, aiAvailable, activeProvider, RewriteError } from "./rewrite.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const OVERVIEW_PER_SECTOR = 3;

// What a client (web now, iOS later) receives for a story.
function present(story) {
  return {
    id: story.id,
    sectorId: story.sectorId,
    title: story.title,
    body: story.body,
    url: story.url ?? null,
    source: story.source,
    sources: story.sources,
    publishedAt: story.publishedAt,
    sample: story.sample,
  };
}

app.get("/api/sectors", (req, res) => {
  res.json({
    sectors: SECTORS.map(({ id, name, emoji, group }) => ({ id, name, emoji, group })),
    maxStoriesPerSector: MAX_STORIES_PER_SECTOR,
    aiAvailable: aiAvailable(),
  });
});

// Overview: the reader's chosen sectors, in their priority order, top stories of each.
app.get("/api/overview", async (req, res) => {
  const known = new Set(SECTORS.map((s) => s.id));
  const wanted = String(req.query.sectors || "")
    .split(",")
    .filter((id) => known.has(id));
  const ids = [...new Set(wanted)];
  const sections = await Promise.all(
    ids.map(async (id) => ({
      sectorId: id,
      stories: (await getSectorStories(id)).slice(0, OVERVIEW_PER_SECTOR).map(present),
    })),
  );
  res.json({ sections });
});

// Deep dive: never more than 10 stories.
app.get("/api/sectors/:id/stories", async (req, res) => {
  const stories = await getSectorStories(req.params.id);
  if (!stories) return res.status(404).json({ error: "Unknown sector" });
  res.json({ stories: stories.map(present) });
});

app.get("/api/stories/:id", (req, res) => {
  const story = getStory(req.params.id);
  if (!story) return res.status(404).json({ error: "Story not found. It may have dropped out of the top stories." });
  res.json({ story: present(story) });
});

// The story page: full write-up, simple-English framework and Gen Z version, written in one go.
app.get("/api/stories/:id/reading", async (req, res) => {
  const story = getStory(req.params.id);
  if (!story) return res.status(404).json({ error: "Story not found. It may have dropped out of the top stories." });
  try {
    res.json({ reading: await getReading(story) });
  } catch (error) {
    if (error instanceof RewriteError) return res.status(error.status).json({ error: error.message });
    console.error(error);
    res.status(500).json({ error: "Something went wrong while writing this story." });
  }
});

app.use(express.static(path.join(here, "..", "public")));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Tenfold running at http://localhost:${port}`);
  const provider = activeProvider();
  console.log(provider ? `Rewrites: on, using ${provider.name}` : "Rewrites: off (add GEMINI_API_KEY to a .env file to enable)");
});
