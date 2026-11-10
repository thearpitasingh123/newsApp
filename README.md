# Tenfold

A calm news reader. Pick the sectors you follow, get at most 10 stories per sector,
and read each one three ways: Full story, Plain English (a 5-stage Read / Understand /
Connect / Retain / Apply breakdown with a quiz) and Gen Z.

## Run

```bash
npm install
npm start
```

Open http://localhost:3000.

- **Live news** comes from the RSS feeds listed in `server/sectors.js`. If none can be
  reached, the app shows clearly labelled sample stories instead.
- **The story page** is written by AI from the full article: when you open a live story, the
  server reads the article from the publisher and writes all three tabs with Google Gemini's
  free tier. Sample stories come with pre-written text and need no key.

## Turning on rewrites (free)

1. Create a free API key at https://aistudio.google.com/apikey (Google account, no card).
2. Copy `.env.example` to `.env` and paste the key after `GEMINI_API_KEY=`.
3. Run `npm start`. The console should say `Rewrites: on, using Google Gemini`.

Each story is written once, with a single request for all three tabs, and the result is
saved in `data/readings.json`. Opening a story for the first time uses one request from the
free tier's daily limit; when that runs out, the story page says so and shows the
publisher's short summary until the next day.

Claude is also supported: set `ANTHROPIC_API_KEY` (and `AI_PROVIDER=claude` if both keys
are present). That one is paid.

## Layout

- `server/` - the API (`/api/sectors`, `/api/overview`, `/api/sectors/:id/stories`,
  `/api/stories/:id`, `/api/stories/:id/reading`). A future iOS app uses the same API.
- `public/` - the web app.
- `test/` - `npm test`.
