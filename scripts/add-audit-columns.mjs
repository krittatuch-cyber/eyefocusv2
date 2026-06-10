// scripts/add-audit-columns.mjs — Direct column addition with verification
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
const sql = neon(process.env.DATABASE_URL);

console.log("Adding missing audit_log columns...\n");

// Run each as separate await
try {
  await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(10) NOT NULL DEFAULT 'LOW'`;
  console.log("✅ severity added");
} catch(e) { console.log("severity:", e.message); }

try {
  await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role VARCHAR(50)`;
  console.log("✅ user_role added");
} catch(e) { console.log("user_role:", e.message); }

try {
  await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'success'`;
  console.log("✅ status added");
} catch(e) { console.log("status:", e.message); }

try {
  await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_value JSONB`;
  console.log("✅ old_value added");
} catch(e) { console.log("old_value:", e.message); }

try {
  await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value JSONB`;
  console.log("✅ new_value added");
} catch(e) { console.log("new_value:", e.message); }

// Verify immediately
await new Promise(r => setTimeout(r, 1000));
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs' ORDER BY ordinal_position`;
console.log("\nFinal columns:", cols.map(c => c.column_name).join(", "));
