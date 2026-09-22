import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, "backend", ".env") });

export const config = {
  port: Number(process.env.PORT) || 4000,
  tmdbApiKey: process.env.TMDB_API_KEY || "",
  tmdbBaseUrl: "https://api.themoviedb.org/3",
  tmdbImageBase: "https://image.tmdb.org/t/p",
  cacheTtlMs: Number(process.env.CACHE_TTL_MS) || 10 * 60 * 1000,
  tmdbTimeoutMs: Number(process.env.TMDB_TIMEOUT_MS) || 8000,
  dbPath: path.join(rootDir, "backend", "data", "app.db"),
};
