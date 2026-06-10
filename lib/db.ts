// lib/db.ts — Neon + Drizzle ORM client (resolves @/lib/db)
// Pages that need mock data should import from @/lib/db-mock directly.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";

// Use placeholder URL at build time; real queries will fail gracefully without DATABASE_URL
const url = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost/placeholder";
const sql = neon(url);

export const db = drizzle(sql, { schema });
export * from "./db/schema";
