import express from "express";
import cors from "cors";
import { config } from "./config.js";
import "./db.js";
import moviesRouter from "./routes/movies.js";
import wishlistRouter from "./routes/wishlist.js";
import { TmdbError } from "./tmdb.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, tmdbConfigured: Boolean(config.tmdbApiKey) });
});

app.use("/api/movies", moviesRouter);
app.use("/api/wishlist", wishlistRouter);

app.use((error, _req, res, _next) => {
  if (error instanceof TmdbError) {
    return res.status(error.status).json({ error: error.message, code: error.code });
  }
  console.error(error);
  res.status(500).json({ error: "Something went wrong on the server.", code: "SERVER" });
});

app.listen(config.port, () => {
  console.log(`Movie Discovery API listening on http://localhost:${config.port}`);
  if (!config.tmdbApiKey) {
    console.warn("Warning: TMDB_API_KEY is not set. Movie routes will fail until it is added.");
  }
});
