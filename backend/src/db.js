import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config.js";

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS wishlist (
    tmdb_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    poster_url TEXT,
    release_date TEXT,
    rating REAL,
    overview TEXT,
    added_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const wishlistQueries = {
  list: db.prepare(`
    SELECT tmdb_id AS id, title, poster_url AS posterUrl, release_date AS releaseDate,
           rating, overview, added_at AS addedAt
    FROM wishlist
    ORDER BY added_at DESC
  `),
  get: db.prepare(`SELECT tmdb_id FROM wishlist WHERE tmdb_id = ?`),
  ids: db.prepare(`SELECT tmdb_id AS id FROM wishlist`),
  insert: db.prepare(`
    INSERT INTO wishlist (tmdb_id, title, poster_url, release_date, rating, overview)
    VALUES (@id, @title, @posterUrl, @releaseDate, @rating, @overview)
    ON CONFLICT(tmdb_id) DO UPDATE SET
      title = excluded.title,
      poster_url = excluded.poster_url,
      release_date = excluded.release_date,
      rating = excluded.rating,
      overview = excluded.overview
  `),
  remove: db.prepare(`DELETE FROM wishlist WHERE tmdb_id = ?`),
};
