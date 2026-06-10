// lib/db/index.ts — Neon + Drizzle client (Edge-compatible)
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Enable HTTP connection caching within the same Worker instance
// Reduces repeated connection overhead for multiple queries per request
neonConfig.fetchConnectionCache = true;


// DATABASE_URL must be set in environment
// Format: postgresql://user:pass@ep-xxx.neon.tech/eyefocus?sslmode=require
function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export const db = getDb();
export type DbClient = typeof db;
