# Tenfold

A calm news reader. Pick the sectors you follow, get at most 10 stories per sector,
and read each one three ways: Original, Plain English (no jargon) and Gen Z.

## Run

```bash
npm install
npm start
```

Open http://localhost:3000.

- **Live news** comes from the RSS feeds listed in `server/sectors.js`. If none can be
  reached, the app shows clearly labelled sample stories instead.
- **Rewrites** (the Plain English and Gen Z tabs) on live stories use Google Gemini's free
  tier. Sample stories come with pre-written versions and need no key.

## Turning on rewrites (free)

1. Create a free API key at https://aistudio.google.com/apikey (Google account, no card).
2. Copy `.env.example` to `.env` and paste the key after `GEMINI_API_KEY=`.
3. Run `npm start`. The console should say `Rewrites: on, using Google Gemini`.

Each story is rewritten once, in both styles, with a single request, and the result is
saved in `data/rewrites.json`. The free tier has a daily request limit; when it runs out
the tabs say so and work again the next day.

Claude is also supported: set `ANTHROPIC_API_KEY` (and `AI_PROVIDER=claude` if both keys
are present). That one is paid.

## Layout

- `server/` - the API (`/api/sectors`, `/api/overview`, `/api/sectors/:id/stories`,
  `/api/stories/:id`, `/api/stories/:id/versions/:style`). A future iOS app uses the same API.
- `public/` - the web app.
- `test/` - `npm test`.
