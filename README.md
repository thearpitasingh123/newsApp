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
- **AI rewrites** of live stories need a Claude API key: set `ANTHROPIC_API_KEY` before
  `npm start`. Sample stories come with pre-written versions and need no key.

## Layout

- `server/` - the API (`/api/sectors`, `/api/overview`, `/api/sectors/:id/stories`,
  `/api/stories/:id`, `/api/stories/:id/versions/:style`). A future iOS app uses the same API.
- `public/` - the web app.
- `test/` - `npm test`.
