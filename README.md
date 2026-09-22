# Movie Discovery App (Lumen)

A movie discovery product: browse, search, filter, paginate, open details, and keep a persistent wishlist. The React client talks only to this Node.js API. The API is an abstraction over [TMDB](https://www.themoviedb.org/).

## Setup

You need Node.js 18+.

1. Copy environment variables and add a TMDB API key (free from [TMDB API settings](https://www.themoviedb.org/settings/api)):

```bash
cd movie-discovery
copy .env.example .env
```

Edit `.env` and set `TMDB_API_KEY`.

2. Install and run the backend:

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:4000`

3. In another terminal, install and run the frontend:

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

The Vite dev server proxies `/api` to the backend so the browser never calls TMDB.

## Approach

Users land on a **Discover** feed (popular / trending / now playing / upcoming / top rated) so they can find something without knowing a title. Search, genre, year, and sort are stored in the URL so back/forward and sharing keep context. Movie details open as a separate route; the previous browse URL is restored via router state.

Wishlist items are saved in **SQLite** with a snapshot of title, poster, rating, and overview. That way the list still renders after a restart, and still shows saved titles if TMDB is briefly unavailable.

The backend maps TMDB’s shape into a smaller, stable JSON contract. The UI never depends on TMDB field names.

## Technical decisions

- **React + Vite + Express + SQLite** — fits the required stack, easy local setup, no hosted DB required for review.
- **TMDB as the catalog** — large corpus, genres, search, discover, and detail in one API.
- **In-memory TTL cache (10 minutes)** — repeated page loads, filter toggles, and genre lists do not each hit TMDB. Helps with rate limits.
- **Timeouts and mapped errors** — slow/down/rate-limited TMDB becomes 504 / 503 / 429 with a client-readable message.
- **Pagination from TMDB pages** — large result sets stay on the server; the client never downloads the full catalog.
- **Debounced search + AbortController** — fast typing and filter changes cancel stale in-flight work.
- **Incomplete TMDB payloads** — missing posters, titles, and overviews get safe fallbacks in the mapper.
- **No auth** — the brief did not require accounts. Wishlist is a single shared list on the server (fine for a local demo). A user id / cookie would be the next step.
- **Posters from TMDB’s image CDN** — static files, not the JSON API. Movie metadata always goes through Node.

## Assumptions

- One reviewer will run the app locally with their own TMDB key.
- Adult content is excluded.
- Search uses TMDB search; genre/year filters are most accurate on the Discover endpoints (non-search). Search results can still be re-sorted on the current page.
- Wishlist is not per-user.

## Known limitations

- TMDB caps discover/search at 500 pages.
- Search + genre together is not a first-class TMDB operation; combining them is imperfect.
- Cache is in-memory, so it resets when the server restarts and does not share across processes.
- Wishlist snapshots can drift from live TMDB data until the user saves the title again.
- No automated test suite yet.

## AI tools used

Used Cursor to scaffold Express/React boilerplate, map TMDB responses, and iterate on UI structure. API contract, caching, SQLite wishlist schema, URL-driven browse state, and error/empty/loading behaviour were chosen to match the assignment constraints and kept intentionally small so they can be explained and extended in review.

## What I would improve with more time

- Per-user wishlist (session or simple auth).
- Redis or SQLite-backed cache shared across instances.
- Infinite scroll option alongside page controls.
- Watchlist folders and notes.
- Contract tests against recorded TMDB fixtures.
- Image proxy if a fully locked-down network is required.
