import { Router } from "express";
import { wishlistQueries } from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ movies: wishlistQueries.list.all() });
});

router.get("/ids", (_req, res) => {
  res.json({ ids: wishlistQueries.ids.all().map((row) => row.id) });
});

router.post("/", (req, res) => {
  const id = Number(req.body?.id);
  const title = String(req.body?.title || "").trim();
  if (!Number.isInteger(id) || id <= 0 || !title) {
    return res.status(400).json({ error: "A movie id and title are required.", code: "BAD_REQUEST" });
  }

  wishlistQueries.insert.run({
    id,
    title: title.slice(0, 300),
    posterUrl: req.body?.posterUrl || null,
    releaseDate: req.body?.releaseDate || null,
    rating: typeof req.body?.rating === "number" ? req.body.rating : null,
    overview: String(req.body?.overview || "").slice(0, 2000),
  });

  res.status(201).json({ ok: true, id });
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid movie id.", code: "BAD_REQUEST" });
  }
  const result = wishlistQueries.remove.run(id);
  if (!result.changes) {
    return res.status(404).json({ error: "Movie is not on the wishlist.", code: "NOT_FOUND" });
  }
  res.json({ ok: true, id });
});

export default router;
