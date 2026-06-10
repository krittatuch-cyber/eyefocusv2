import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name IN ('role','roles') ORDER BY column_name`;
console.log("Columns:", JSON.stringify(cols, null, 2));
const dist = await sql`SELECT role, roles, COUNT(*)::int as count FROM users GROUP BY role, roles LIMIT 10`;
console.log("Distribution:", JSON.stringify(dist, null, 2));
