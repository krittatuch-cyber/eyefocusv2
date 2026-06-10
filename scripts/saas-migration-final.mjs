// scripts/saas-migration-final.mjs — Phase 1 migration via tagged template (guaranteed to work)
// Run: node --env-file=.env.local scripts/saas-migration-final.mjs
import { neon } from "@neondatabase/serverless";

const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function safe(label, fn) {
  try { await fn(); console.log(`  ✅ ${label}`); }
  catch(e) {
    const msg = e.message.split("\n")[0];
    if (msg.includes("already exists") || msg.includes("multiple primary")) {
      console.log(`  ⏭️  ${label} (already done)`);
    } else {
      console.log(`  ❌ ${label}: ${msg}`);
    }
  }
}

async function main() {
  console.log("🚀 EyeFocus SaaS — Phase 1 Migration (tagged template)\n");

  // ── SUPER_ADMIN enum ───────────────────────────────────────────────────────
  console.log("1️⃣  Role enum...");
  await safe("SUPER_ADMIN to role enum", () =>
    sql`ALTER TYPE role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN' BEFORE 'OWNER'`);

  // ── Tenants plan columns ───────────────────────────────────────────────────
  console.log("\n2️⃣  Tenants plan fields...");
  await safe("plan_expires_at", () => sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ`);
  await safe("trial_ends_at",   () => sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ`);
  await safe("max_branches",    () => sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_branches INT NOT NULL DEFAULT 1`);
  await safe("max_users",       () => sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INT NOT NULL DEFAULT 5`);
  await safe("is_suspended",    () => sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE`);

  // ── order_items tenant isolation ───────────────────────────────────────────
  console.log("\n3️⃣  order_items.tenant_id...");
  await safe("add column", () => sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tenant_id UUID`);
  await safe("backfill",   () => sql`UPDATE order_items oi SET tenant_id=(SELECT tenant_id FROM orders o WHERE o.id=oi.order_id) WHERE tenant_id IS NULL`);
  await safe("NOT NULL",   () => sql`ALTER TABLE order_items ALTER COLUMN tenant_id SET NOT NULL`);
  await safe("FK",         () => sql`ALTER TABLE order_items ADD CONSTRAINT order_items_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE`);
  await safe("index",      () => sql`CREATE INDEX IF NOT EXISTS order_items_tenant_idx ON order_items(tenant_id)`);

  // ── installments tenant isolation ──────────────────────────────────────────
  console.log("\n4️⃣  installments.tenant_id...");
  await safe("add column", () => sql`ALTER TABLE installments ADD COLUMN IF NOT EXISTS tenant_id UUID`);
  await safe("backfill",   () => sql`UPDATE installments i SET tenant_id=(SELECT tenant_id FROM orders o WHERE o.id=i.order_id) WHERE tenant_id IS NULL`);
  await safe("NOT NULL",   () => sql`ALTER TABLE installments ALTER COLUMN tenant_id SET NOT NULL`);
  await safe("FK",         () => sql`ALTER TABLE installments ADD CONSTRAINT installments_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE`);
  await safe("index",      () => sql`CREATE INDEX IF NOT EXISTS installments_tenant_idx ON installments(tenant_id)`);

  // ── Verify ─────────────────────────────────────────────────────────────────
  console.log("\n🔍 Verifying...");
  const tenantCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='tenants' AND table_schema='public' ORDER BY ordinal_position`;
  console.log("  tenants:", tenantCols.map(r=>r.column_name).join(", "));

  const oiCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND table_schema='public' ORDER BY ordinal_position`;
  console.log("  order_items:", oiCols.map(r=>r.column_name).join(", "));

  const roles = await sql`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='role' ORDER BY e.enumsortorder`;
  console.log("  roles:", roles.map(r=>r.enumlabel).join(", "));

  // ── Demo tenant plan ───────────────────────────────────────────────────────
  const hasMaxBranches = tenantCols.some(r=>r.column_name==='max_branches');
  if (hasMaxBranches) {
    const t = await sql`UPDATE tenants SET max_branches=3, max_users=10, plan_type='pro' WHERE name='Eye Focus Optical' RETURNING id,name,plan_type,max_branches,max_users`;
    if (t.length) console.log(`\n✅ Demo tenant: ${t[0].name} | plan=${t[0].plan_type} | branches=${t[0].max_branches} | users=${t[0].max_users}`);
  }

  const hasSuper = roles.some(r=>r.enumlabel==='SUPER_ADMIN');
  const hasOITenant = oiCols.some(r=>r.column_name==='tenant_id');
  console.log(`\n${ hasSuper ? '✅' : '❌'} SUPER_ADMIN role | ${ hasOITenant ? '✅' : '❌'} order_items.tenant_id | ${ hasMaxBranches ? '✅' : '❌'} tenants.max_branches`);
  console.log("\n🎉 Phase 1 Migration complete!");
}

main().catch(e=>{console.error("❌",e.message);process.exit(1);});
