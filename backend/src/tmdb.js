import { config } from "./config.js";
import { TtlCache } from "./cache.js";

const cache = new TtlCache(config.cacheTtlMs);
const genreCache = new TtlCache(24 * 60 * 60 * 1000);

class TmdbError extends Error {
  constructor(message, status = 502, code = "TMDB_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function requireKey() {
  if (!config.tmdbApiKey) {
    throw new TmdbError(
      "TMDB_API_KEY is missing. Add it to the project .env file.",
      500,
      "CONFIG"
    );
  }
}

async function tmdbFetch(pathname, params = {}) {
  requireKey();
  const url = new URL(`${config.tmdbBaseUrl}${pathname}`);
  url.searchParams.set("api_key", config.tmdbApiKey);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const cacheKey = url.toString().replace(config.tmdbApiKey, "KEY");
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(config.tmdbTimeoutMs) });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new TmdbError("The movie service took too long to respond.", 504, "TIMEOUT");
    }
    throw new TmdbError("Could not reach the movie service.", 503, "NETWORK");
  }

  if (response.status === 429) {
    throw new TmdbError("The movie service is rate-limiting requests. Try again shortly.", 429, "RATE_LIMIT");
  }
  if (!response.ok) {
    throw new TmdbError("The movie service returned an error.", 502, "UPSTREAM");
  }

  const data = await response.json();
  cache.set(cacheKey, data);
  return data;
}

export async function getGenres() {
  const cached = genreCache.get("genres");
  if (cached) return cached;
  const data = await tmdbFetch("/genre/movie/list");
  const genres = Array.isArray(data?.genres) ? data.genres : [];
  genreCache.set("genres", genres);
  return genres;
}

export async function getGenreLookup() {
  const genres = await getGenres();
  return new Map(genres.map((g) => [g.id, g.name]));
}

export async function listMovies({ collection, query, genre, year, sort, page }) {
  const safePage = Math.min(Math.max(Number(page) || 1, 1), 500);

  if (query) {
    return tmdbFetch("/search/movie", {
      query,
      page: safePage,
      include_adult: false,
    });
  }

  const collections = {
    trending: "/trending/movie/week",
    popular: "/movie/popular",
    now_playing: "/movie/now_playing",
    upcoming: "/movie/upcoming",
    top_rated: "/movie/top_rated",
  };

  if (!genre && !year && (!sort || sort === "popularity") && collections[collection]) {
    return tmdbFetch(collections[collection], { page: safePage });
  }

  const sortMap = {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    newest: "primary_release_date.desc",
    oldest: "primary_release_date.asc",
    title: "original_title.asc",
  };

  return tmdbFetch("/discover/movie", {
    page: safePage,
    with_genres: genre || undefined,
    primary_release_year: year || undefined,
    sort_by: sortMap[sort] || "popularity.desc",
    include_adult: false,
    "vote_count.gte": sort === "rating" ? 80 : undefined,
  });
}

export async function getMovie(id) {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: "credits,videos,similar",
  });
}

export { TmdbError };
