import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);
try {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`;
  console.log("✅ image_url added to products");
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='products' ORDER BY ordinal_position`;
  console.log("Products columns:", cols.map(c => c.column_name).join(", "));
} catch (e) {
  console.error("Migration error:", e.message);
}
