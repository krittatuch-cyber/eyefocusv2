// scripts/saas-phase1-migration.mjs
// Phase 1 SaaS migration: add tenant_id to order_items + installments,
// add plan fields to tenants, add SUPER_ADMIN to role enum
// Run: node --env-file=.env.local scripts/saas-phase1-migration.mjs

import { neon } from "@neondatabase/serverless";

const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function run(label, query) {
  try {
    await sql.unsafe(query);
    console.log(`  ✅ ${label}`);
  } catch (e) {
    if (e.message.includes("already exists") || e.message.includes("does not exist")) {
      console.log(`  ⏭️  ${label} (skipped: ${e.message.split("\n")[0]})`);
    } else {
      console.log(`  ❌ ${label}: ${e.message}`);
    }
  }
}

async function main() {
  console.log("🚀 EyeFocus SaaS — Phase 1 Migration\n");

  // ── 1. Add SUPER_ADMIN to role enum ─────────────────────────────────────
  console.log("📋 Role enum update...");
  await run("Add SUPER_ADMIN to role enum",
    `ALTER TYPE role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN' BEFORE 'OWNER'`);

  // ── 2. Tenants: plan-related columns ─────────────────────────────────────
  console.log("\n📋 Tenants plan fields...");
  await run("tenants.plan_expires_at",
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ`);
  await run("tenants.trial_ends_at",
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ`);
  await run("tenants.max_branches",
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_branches INT NOT NULL DEFAULT 1`);
  await run("tenants.max_users",
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INT NOT NULL DEFAULT 5`);
  await run("tenants.is_suspended",
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE`);

  // ── 3. order_items: add tenant_id ────────────────────────────────────────
  console.log("\n📋 order_items tenant isolation...");
  await run("order_items.tenant_id column",
    `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tenant_id UUID`);

  // Backfill from parent orders table
  await run("order_items.tenant_id backfill",
    `UPDATE order_items oi
     SET tenant_id = o.tenant_id
     FROM orders o
     WHERE oi.order_id = o.id AND oi.tenant_id IS NULL`);

  // Make NOT NULL after backfill
  await run("order_items.tenant_id NOT NULL",
    `ALTER TABLE order_items ALTER COLUMN tenant_id SET NOT NULL`);

  // FK constraint
  await run("order_items.tenant_id FK",
    `ALTER TABLE order_items
     ADD CONSTRAINT order_items_tenant_id_fkey
     FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE`);

  // Index
  await run("order_items tenant index",
    `CREATE INDEX IF NOT EXISTS order_items_tenant_idx ON order_items(tenant_id)`);

  // ── 4. installments: add tenant_id ───────────────────────────────────────
  console.log("\n📋 installments tenant isolation...");
  await run("installments.tenant_id column",
    `ALTER TABLE installments ADD COLUMN IF NOT EXISTS tenant_id UUID`);

  await run("installments.tenant_id backfill",
    `UPDATE installments i
     SET tenant_id = o.tenant_id
     FROM orders o
     WHERE i.order_id = o.id AND i.tenant_id IS NULL`);

  await run("installments.tenant_id NOT NULL",
    `ALTER TABLE installments ALTER COLUMN tenant_id SET NOT NULL`);

  await run("installments.tenant_id FK",
    `ALTER TABLE installments
     ADD CONSTRAINT installments_tenant_id_fkey
     FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE`);

  await run("installments tenant index",
    `CREATE INDEX IF NOT EXISTS installments_tenant_idx ON installments(tenant_id)`);

  // ── 5. Verify ─────────────────────────────────────────────────────────────
  console.log("\n🔍 Verifying...");
  const tenantCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'tenants' AND table_schema = 'public'
    AND column_name IN ('plan_expires_at','trial_ends_at','max_branches','max_users','is_suspended')
  `;
  console.log("  tenants new cols:", tenantCols.map(r => r.column_name).join(", "));

  const orderItemCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'order_items' AND table_schema = 'public' AND column_name = 'tenant_id'
  `;
  console.log("  order_items.tenant_id:", orderItemCols.length ? "✅" : "❌");

  // ── 6. Set demo tenant plan metadata ─────────────────────────────────────
  console.log("\n📝 Setting demo tenant plan...");
  const updated = await sql`
    UPDATE tenants
    SET
      max_branches = 3,
      max_users = 10,
      plan_type = 'pro'
    WHERE name = 'Eye Focus Optical'
    RETURNING id, name, plan_type, max_branches, max_users
  `;
  if (updated.length) {
    const t = updated[0];
    console.log(`  ✅ ${t.name}: plan=${t.plan_type}, branches=${t.max_branches}, users=${t.max_users}`);
  }

  console.log("\n🎉 Phase 1 Migration complete!");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
