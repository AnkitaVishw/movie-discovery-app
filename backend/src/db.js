import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import initSqlJs from "sql.js";
import { config } from "./config.js";

const require = createRequire(import.meta.url);

let db;

function persist() {
  const data = db.export();
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  fs.writeFileSync(config.dbPath, Buffer.from(data));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export async function initDb() {
  if (db) return;
  const wasmPath = path.join(path.dirname(require.resolve("sql.js")), "sql-wasm.wasm");
  const SQL = await initSqlJs({ wasmBinary: fs.readFileSync(wasmPath) });
  if (fs.existsSync(config.dbPath)) {
    db = new SQL.Database(fs.readFileSync(config.dbPath));
  } else {
    db = new SQL.Database();
  }
  db.run(`
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
  persist();
}

export const wishlistQueries = {
  list: {
    all() {
      return all(`
        SELECT tmdb_id AS id, title, poster_url AS posterUrl, release_date AS releaseDate,
               rating, overview, added_at AS addedAt
        FROM wishlist
        ORDER BY added_at DESC
      `);
    },
  },
  ids: {
    all() {
      return all(`SELECT tmdb_id AS id FROM wishlist`);
    },
  },
  insert: {
    run({ id, title, posterUrl, releaseDate, rating, overview }) {
      db.run(
        `
        INSERT INTO wishlist (tmdb_id, title, poster_url, release_date, rating, overview)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(tmdb_id) DO UPDATE SET
          title = excluded.title,
          poster_url = excluded.poster_url,
          release_date = excluded.release_date,
          rating = excluded.rating,
          overview = excluded.overview
        `,
        [id, title, posterUrl, releaseDate, rating, overview]
      );
      persist();
    },
  },
  remove: {
    run(id) {
      db.run(`DELETE FROM wishlist WHERE tmdb_id = ?`, [id]);
      const changes = db.getRowsModified();
      persist();
      return { changes };
    },
  },
};
