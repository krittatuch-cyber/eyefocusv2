// scripts/saas-verify2.mjs — Simple verify using tagged template only
import { neon } from "@neondatabase/serverless";
const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function main() {
  const tenantCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='tenants' AND table_schema='public' ORDER BY ordinal_position`;
  console.log("tenants cols:", tenantCols.map(r=>r.column_name).join(", "));

  const oiCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND table_schema='public' ORDER BY ordinal_position`;
  console.log("order_items cols:", oiCols.map(r=>r.column_name).join(", "));

  const roles = await sql`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='role' ORDER BY e.enumsortorder`;
  console.log("roles:", roles.map(r=>r.enumlabel).join(", "));

  // Update demo tenant
  const t = await sql`UPDATE tenants SET max_branches=3, max_users=10, plan_type='pro' WHERE name='Eye Focus Optical' RETURNING id,name,plan_type,max_branches,max_users`;
  if (t.length) console.log("\n✅ Demo tenant updated:", t[0].name, "plan:", t[0].plan_type, "branches:", t[0].max_branches);
  else console.log("⚠️  Demo tenant not found");
}
main().catch(e=>{console.error("❌",e.message);process.exit(1);});
