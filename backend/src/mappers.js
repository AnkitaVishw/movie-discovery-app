import { config } from "./config.js";

function imageUrl(path, size = "w500") {
  if (!path) return null;
  return `${config.tmdbImageBase}/${size}${path}`;
}

function yearFromDate(value) {
  if (!value || typeof value !== "string") return null;
  const year = value.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export function mapMovieSummary(raw, genreLookup = new Map()) {
  const title = (raw?.title || raw?.name || "").trim() || "Untitled";
  const genreIds = Array.isArray(raw?.genre_ids) ? raw.genre_ids : [];
  const genresFromIds = genreIds
    .map((id) => genreLookup.get(id))
    .filter(Boolean);
  const genresFromObjects = Array.isArray(raw?.genres)
    ? raw.genres.map((g) => g?.name).filter(Boolean)
    : [];

  return {
    id: raw?.id ?? null,
    title,
    overview: typeof raw?.overview === "string" ? raw.overview.trim() : "",
    releaseDate: raw?.release_date || raw?.first_air_date || null,
    year: yearFromDate(raw?.release_date || raw?.first_air_date),
    rating: typeof raw?.vote_average === "number" ? Number(raw.vote_average.toFixed(1)) : 0,
    voteCount: typeof raw?.vote_count === "number" ? raw.vote_count : 0,
    posterUrl: imageUrl(raw?.poster_path, "w342"),
    backdropUrl: imageUrl(raw?.backdrop_path, "w780"),
    genres: genresFromObjects.length ? genresFromObjects : genresFromIds,
    originalLanguage: raw?.original_language || null,
    popularity: typeof raw?.popularity === "number" ? raw.popularity : 0,
  };
}

export function mapMovieDetail(raw) {
  const summary = mapMovieSummary(raw);
  const videos = raw?.videos?.results || [];
  const trailer = videos.find(
    (v) => v?.site === "YouTube" && v?.type === "Trailer" && v?.key
  ) || videos.find((v) => v?.site === "YouTube" && v?.key);

  return {
    ...summary,
    runtime: typeof raw?.runtime === "number" && raw.runtime > 0 ? raw.runtime : null,
    tagline: raw?.tagline || "",
    status: raw?.status || null,
    budget: raw?.budget || 0,
    revenue: raw?.revenue || 0,
    homepage: raw?.homepage || null,
    imdbId: raw?.imdb_id || null,
    trailerKey: trailer?.key || null,
    cast: Array.isArray(raw?.credits?.cast)
      ? raw.credits.cast.slice(0, 12).map((person) => ({
          id: person.id,
          name: person.name || "Unknown",
          character: person.character || "",
          photoUrl: imageUrl(person.profile_path, "w185"),
        }))
      : [],
    similar: Array.isArray(raw?.similar?.results)
      ? raw.similar.results.filter((m) => m?.id).slice(0, 12).map((m) => mapMovieSummary(m))
      : [],
  };
}

export function mapGenre(raw) {
  return { id: raw.id, name: raw.name };
}
