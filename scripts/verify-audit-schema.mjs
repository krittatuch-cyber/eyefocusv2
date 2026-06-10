import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
const sql = neon(process.env.DATABASE_URL);

const [cols, cnt] = await Promise.all([
  sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs' ORDER BY ordinal_position`,
  sql`SELECT count(*)::int as cnt FROM (SELECT unnest(enum_range(NULL::audit_action))::text AS val) t`,
]);

console.log("\n📋 audit_logs columns:");
cols.forEach(c => console.log(`  ${c.column_name.padEnd(20)} ${c.data_type}`));
console.log(`\n📊 audit_action enum values: ${cnt[0].cnt}`);
