import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, "backend", ".env") });

export const config = {
  port: Number(process.env.PORT) || 4000,
  tvmazeBaseUrl: "https://api.tvmaze.com",
  cacheTtlMs: Number(process.env.CACHE_TTL_MS) || 30 * 60 * 1000,
  upstreamTimeoutMs: Number(process.env.UPSTREAM_TIMEOUT_MS) || 8000,
  catalogPages: Number(process.env.CATALOG_PAGES) || 4,
  pageSize: 20,
  dbPath: path.join(rootDir, "backend", "data", "app.db"),
};
