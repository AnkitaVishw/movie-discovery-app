# Movie Discovery App (Lumen)

A movie discovery product: browse, search, filter, paginate, open details, and keep a persistent wishlist. The React client talks only to this Node.js API.

Movie data comes from **[TVMaze](https://www.tvmaze.com/api)** — a free public catalog. **No API key and no sign-up** are required.

## Setup

You need Node.js 18+.

1. Install and run the backend:

```powershell
cd backend
npm install
npm run dev
```

API: `http://localhost:4000`

2. In another terminal, install and run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

The Vite dev server proxies `/api` to the backend so the browser never calls TVMaze.

Optional: copy `.env.example` to `.env` only if you want to change the port or cache time. It is not required to run.

## Approach

Users land on a **Discover** feed so they can find something without knowing a title. Search, genre, year, and sort live in the URL so back/forward keep context. Movie details are a separate route; Discover remembers the last browse query.

Wishlist items are saved in **SQLite** (via `sql.js`, no native compile) with a snapshot of title, poster, rating, and overview.

The backend maps TVMaze’s shape into a smaller JSON contract. The UI never depends on TVMaze field names.

## Technical decisions

- **React + Vite + Express + SQLite (sql.js)** — required stack, no native C++ build, works on Node 18–25.
- **TVMaze as the catalog** — free, no key, search, schedule, genres, cast, and paging.
- **In-memory TTL cache** — repeated browse/filter requests do not each hit TVMaze (they ask consumers to cache).
- **Timeouts and mapped errors** — slow/down/rate-limited catalog becomes 504 / 503 / 429.
- **Server-side filtering and paging** — the client never downloads the full catalog at once.
- **Debounced search + AbortController** — fast typing cancels stale work.
- **No auth** — wishlist is a single local list for the demo.

## Assumptions

- Titles in this catalog are TVMaze shows (series and film-style titles), not a paid movie studio feed.
- One reviewer runs the app locally with internet access to `api.tvmaze.com`.
- Wishlist is not per-user.

## Known limitations

- Popular/top-rated lists are built from a cached window of TVMaze show pages (default 4 pages, ~1,000 titles), then filtered and paged locally.
- TVMaze rate-limits aggressive traffic; cache exists to stay within that.
- Wishlist snapshots can drift from live data until the title is saved again.
- No automated test suite yet.

## AI tools used

Used Cursor to map the free TVMaze catalog onto the existing API contract and UI. Caching, SQLite wishlist, URL-driven browse state, and error/empty/loading behaviour were kept small so they can be explained in review.

## What I would improve with more time

- Per-user wishlist.
- Shared cache across processes.
- Infinite scroll option.
- Contract tests against recorded TVMaze fixtures.
