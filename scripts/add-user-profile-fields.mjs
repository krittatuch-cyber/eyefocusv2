import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT`;
console.log("✅ photo_url added");
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(255)`;
console.log("✅ job_title added");

const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`;
console.log("Users columns:", cols.map(c => c.column_name).join(", "));
