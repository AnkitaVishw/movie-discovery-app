import { Router } from "express";
import { mapGenre, mapMovieDetail, mapMovieSummary } from "../mappers.js";
import { getGenreLookup, getGenres, getMovie, listMovies, TmdbError } from "../tmdb.js";

const router = Router();

function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

router.get("/genres", async (_req, res, next) => {
  try {
    const genres = await getGenres();
    res.json({ genres: genres.map(mapGenre) });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const query = String(req.query.query || "").trim().slice(0, 120);
    const collection = String(req.query.collection || "popular");
    const genre = parsePositiveInt(req.query.genre);
    const year = parsePositiveInt(req.query.year);
    const sort = String(req.query.sort || "popularity");
    const page = parsePositiveInt(req.query.page) || 1;

    const [raw, genreLookup] = await Promise.all([
      listMovies({
        collection,
        query,
        genre,
        year,
        sort,
        page,
      }),
      getGenreLookup(),
    ]);

    const results = Array.isArray(raw?.results) ? raw.results : [];
    let movies = results
      .filter((item) => item?.id)
      .map((item) => mapMovieSummary(item, genreLookup));

    if (query && sort && sort !== "popularity") {
      movies = [...movies].sort((a, b) => {
        if (sort === "rating") return b.rating - a.rating;
        if (sort === "newest") return String(b.releaseDate || "").localeCompare(String(a.releaseDate || ""));
        if (sort === "oldest") return String(a.releaseDate || "").localeCompare(String(b.releaseDate || ""));
        if (sort === "title") return a.title.localeCompare(b.title);
        return 0;
      });
    }

    res.json({
      page: raw?.page || page,
      totalPages: Math.min(raw?.total_pages || 0, 500),
      totalResults: raw?.total_results || movies.length,
      movies,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid movie id.", code: "BAD_REQUEST" });
    }
    const raw = await getMovie(id);
    if (!raw?.id) {
      return res.status(404).json({ error: "Movie not found.", code: "NOT_FOUND" });
    }
    res.json(mapMovieDetail(raw));
  } catch (error) {
    if (error instanceof TmdbError && error.code === "UPSTREAM") {
      return res.status(404).json({ error: "Movie not found.", code: "NOT_FOUND" });
    }
    next(error);
  }
});

export default router;
