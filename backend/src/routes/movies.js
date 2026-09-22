import { Router } from "express";
import { mapGenre, mapShowDetail, mapShowSummary } from "../mappers.js";
import { getGenres, getMovie, listMovies, UpstreamError } from "../catalog.js";

const router = Router();

function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

router.get("/genres", async (_req, res, next) => {
  try {
    const genres = await getGenres();
    res.json({ genres: genres.map((genre) => mapGenre(genre.name)) });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const query = String(req.query.query || "").trim().slice(0, 120);
    const collection = String(req.query.collection || "popular");
    const genre = String(req.query.genre || "").trim();
    const year = parsePositiveInt(req.query.year);
    const sort = String(req.query.sort || "popularity");
    const page = parsePositiveInt(req.query.page) || 1;

    const raw = await listMovies({
      collection,
      query,
      genre,
      year,
      sort,
      page,
    });

    const results = Array.isArray(raw?.results) ? raw.results : [];
    const movies = results.filter((item) => item?.id).map((item) => mapShowSummary(item));

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
    const { raw, similar } = await getMovie(id);
    res.json(mapShowDetail(raw, similar));
  } catch (error) {
    if (error instanceof UpstreamError && error.code === "NOT_FOUND") {
      return res.status(404).json({ error: "Movie not found.", code: "NOT_FOUND" });
    }
    next(error);
  }
});

export default router;
