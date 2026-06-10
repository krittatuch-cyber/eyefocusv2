// scripts/debug.mjs
import { neon } from "@neondatabase/serverless";
const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

const r1 = await sql`SELECT phone, name FROM customers ORDER BY created_at DESC LIMIT 5`;
console.log("Recent customers:", JSON.stringify(r1));

const r2 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' AND table_schema = 'public' ORDER BY ordinal_position`;
console.log("customers columns (public schema):", r2.map(r => r.column_name));

const r3 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'eye_prescriptions' AND table_schema = 'public' ORDER BY ordinal_position`;
console.log("rx columns:", r3.map(r => r.column_name));
