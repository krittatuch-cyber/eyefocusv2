// scripts/saas-verify-patch.mjs — Verify Phase 1 migration + patch demo tenant
// Run: node --env-file=.env.local scripts/saas-verify-patch.mjs
import { neon } from "@neondatabase/serverless";
const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

// All via sql.unsafe to avoid tagged-template schema cache
async function q(query) {
  return Array.from(await sql.unsafe(query));
}

async function main() {
  // Verify columns
  const tenantCols = await q(`SELECT column_name FROM information_schema.columns WHERE table_name='tenants' AND table_schema='public' ORDER BY ordinal_position`);
  console.log("tenants:", tenantCols.map(r=>r.column_name).join(", "));

  const orderItemCols = await q(`SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND table_schema='public' ORDER BY ordinal_position`);
  console.log("order_items:", orderItemCols.map(r=>r.column_name).join(", "));

  const hasMax = tenantCols.some(r=>r.column_name==='max_branches');
  const hasOITenant = orderItemCols.some(r=>r.column_name==='tenant_id');
  console.log("\n✅ max_branches:", hasMax, "| order_items.tenant_id:", hasOITenant);

  if (hasMax) {
    // Update demo tenant plan
    const r = await q(`UPDATE tenants SET max_branches=3, max_users=10, plan_type='pro' WHERE name='Eye Focus Optical' RETURNING id,name,plan_type,max_branches,max_users`);
    if (r.length) console.log("✅ Demo tenant:", JSON.stringify(r[0]));
  }

  // Verify role enum has SUPER_ADMIN
  const roles = await q(`SELECT unnest(enum_range(NULL::role))::text AS r`);
  console.log("roles:", roles.map(r=>r.r).join(", "));
}

main().catch(e=>{console.error("❌",e.message);process.exit(1);});
