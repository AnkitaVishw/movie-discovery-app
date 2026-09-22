import { config } from "./config.js";
import { TtlCache } from "./cache.js";

const cache = new TtlCache(config.cacheTtlMs);

export class UpstreamError extends Error {
  constructor(message, status = 502, code = "UPSTREAM") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function tvmazeFetch(pathname, params = {}) {
  const url = new URL(`${config.tvmazeBaseUrl}${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(config.upstreamTimeoutMs),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new UpstreamError("The movie catalog took too long to respond.", 504, "TIMEOUT");
    }
    throw new UpstreamError("Could not reach the free movie catalog.", 503, "NETWORK");
  }

  if (response.status === 404) {
    cache.set(cacheKey, null);
    return null;
  }
  if (response.status === 429) {
    throw new UpstreamError("The free catalog is rate-limiting requests. Try again shortly.", 429, "RATE_LIMIT");
  }
  if (!response.ok) {
    throw new UpstreamError("The free catalog returned an error.", 502, "UPSTREAM");
  }

  const data = await response.json();
  cache.set(cacheKey, data);
  return data;
}

function uniqueShows(items) {
  const seen = new Set();
  const shows = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    shows.push(item);
  }
  return shows;
}

export async function loadCatalog() {
  const cached = cache.get("catalog:shows");
  if (cached) return cached;

  const pages = [];
  for (let page = 0; page < config.catalogPages; page += 1) {
    const batch = await tvmazeFetch("/shows", { page });
    if (!Array.isArray(batch) || batch.length === 0) break;
    pages.push(...batch);
  }

  const shows = uniqueShows(pages);
  cache.set("catalog:shows", shows);
  return shows;
}

export async function getGenres() {
  const shows = await loadCatalog();
  const names = [...new Set(shows.flatMap((show) => show.genres || []))].sort();
  return names.map((name) => ({ id: name, name }));
}

function sortShows(shows, sort) {
  const copy = [...shows];
  if (sort === "rating") copy.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
  else if (sort === "newest") copy.sort((a, b) => String(b.premiered || "").localeCompare(String(a.premiered || "")));
  else if (sort === "oldest") copy.sort((a, b) => String(a.premiered || "").localeCompare(String(b.premiered || "")));
  else if (sort === "title") copy.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  else copy.sort((a, b) => (b.weight || 0) - (a.weight || 0));
  return copy;
}

function applyFilters(shows, { genre, year }) {
  return shows.filter((show) => {
    if (genre && !(show.genres || []).includes(genre)) return false;
    if (year && !String(show.premiered || "").startsWith(String(year))) return false;
    return true;
  });
}

export async function listMovies({ collection, query, genre, year, sort, page }) {
  const safePage = Math.min(Math.max(Number(page) || 1, 1), 500);

  if (query) {
    const hits = await tvmazeFetch("/search/shows", { q: query });
    const shows = uniqueShows((Array.isArray(hits) ? hits : []).map((hit) => hit?.show).filter(Boolean));
    const filtered = sortShows(applyFilters(shows, { genre, year }), sort);
    return paginate(filtered, safePage);
  }

  if (collection === "now_playing" || collection === "trending") {
    const schedule = await tvmazeFetch("/schedule");
    const shows = uniqueShows((Array.isArray(schedule) ? schedule : []).map((row) => row?.show).filter(Boolean));
    const filtered = sortShows(applyFilters(shows, { genre, year }), sort);
    return paginate(filtered, safePage);
  }

  if (collection === "upcoming") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().slice(0, 10);
    const schedule = await tvmazeFetch("/schedule", { date });
    const shows = uniqueShows((Array.isArray(schedule) ? schedule : []).map((row) => row?.show).filter(Boolean));
    const filtered = sortShows(applyFilters(shows, { genre, year }), sort);
    return paginate(filtered, safePage);
  }

  const catalog = await loadCatalog();
  let shows = catalog;
  if (collection === "top_rated") shows = sortShows(shows, "rating");
  else shows = sortShows(shows, sort || "popularity");
  shows = applyFilters(shows, { genre, year });
  if (collection === "top_rated" && sort && sort !== "popularity") {
    shows = sortShows(shows, sort);
  }
  return paginate(shows, safePage);
}

function paginate(shows, page) {
  const totalResults = shows.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / config.pageSize));
  const start = (page - 1) * config.pageSize;
  return {
    page,
    total_pages: totalPages,
    total_results: totalResults,
    results: shows.slice(start, start + config.pageSize),
  };
}

export async function getMovie(id) {
  const raw = await tvmazeFetch(`/shows/${id}`, { embed: "cast" });
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || !raw.id) {
    throw new UpstreamError("Title not found.", 404, "NOT_FOUND");
  }
  const catalog = (await loadCatalog()) || [];
  const similar = catalog.filter((show) => {
    if (show.id === raw.id) return false;
    return (raw.genres || []).some((genre) => (show.genres || []).includes(genre));
  });
  return { raw, similar };
}

export { tvmazeFetch };
