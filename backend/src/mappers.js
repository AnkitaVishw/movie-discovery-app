function stripHtml(value) {
  if (!value || typeof value !== "string") return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function yearFromDate(value) {
  if (!value || typeof value !== "string") return null;
  const year = value.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export function mapShowSummary(raw) {
  const title = (raw?.name || "").trim() || "Untitled";
  const rating = typeof raw?.rating?.average === "number" ? Number(raw.rating.average.toFixed(1)) : 0;

  return {
    id: raw?.id ?? null,
    title,
    overview: stripHtml(raw?.summary),
    releaseDate: raw?.premiered || null,
    year: yearFromDate(raw?.premiered),
    rating,
    voteCount: typeof raw?.weight === "number" ? raw.weight : 0,
    posterUrl: raw?.image?.medium || raw?.image?.original || null,
    backdropUrl: raw?.image?.original || raw?.image?.medium || null,
    genres: Array.isArray(raw?.genres) ? raw.genres.filter(Boolean) : [],
    originalLanguage: raw?.language || null,
    popularity: typeof raw?.weight === "number" ? raw.weight : 0,
    status: raw?.status || null,
    runtime: typeof raw?.runtime === "number" && raw.runtime > 0 ? raw.runtime : raw?.averageRuntime || null,
  };
}

export function mapShowDetail(raw, similar = []) {
  const summary = mapShowSummary(raw);
  const cast = Array.isArray(raw?._embedded?.cast)
    ? raw._embedded.cast.slice(0, 12).map((entry) => ({
        id: entry?.person?.id,
        name: entry?.person?.name || "Unknown",
        character: entry?.character?.name || "",
        photoUrl: entry?.person?.image?.medium || entry?.person?.image?.original || null,
      }))
    : [];

  return {
    ...summary,
    tagline: raw?.network?.name || raw?.webChannel?.name || "",
    homepage: raw?.officialSite || raw?.url || null,
    imdbId: raw?.externals?.imdb || null,
    trailerKey: null,
    cast,
    similar: similar.filter((item) => item?.id && item.id !== raw?.id).slice(0, 12).map(mapShowSummary),
  };
}

export function mapGenre(name) {
  return { id: name, name };
}
