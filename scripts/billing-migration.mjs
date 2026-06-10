// scripts/billing-migration.mjs — Add billing columns to tenants table
// Run: node --env-file=.env.local scripts/billing-migration.mjs
import { neon } from "@neondatabase/serverless";
const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function safe(label, fn) {
  try { await fn(); console.log(`  ✅ ${label}`); }
  catch(e) {
    const msg = e.message.split("\n")[0];
    if (msg.includes("already exists")) console.log(`  ⏭️  ${label} (already exists)`);
    else console.log(`  ❌ ${label}: ${msg}`);
  }
}

async function main() {
  console.log("🚀 EyeFocus — Billing Migration\n");

  // Omise customer ID (stored for recurring billing)
  await safe("tenants.omise_customer_id", () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS omise_customer_id VARCHAR(50)`);

  // Last successful charge ID
  await safe("tenants.last_charge_id", () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_charge_id VARCHAR(50)`);

  // Billing email (might differ from owner email)
  await safe("tenants.billing_email", () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255)`);

  // Payment method preference: 'card' | 'promptpay'
  await safe("tenants.payment_method", () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'promptpay'`);

  // Dunning state tracking
  await safe("tenants.dunning_count", () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dunning_count INT NOT NULL DEFAULT 0`);
  await safe("tenants.dunning_next_attempt_at", () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS dunning_next_attempt_at TIMESTAMPTZ`);

  // Verify
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='tenants' AND table_schema='public' ORDER BY ordinal_position`;
  console.log("\n📋 tenants columns:", cols.map(r=>r.column_name).join(", "));
  console.log("\n🎉 Billing migration complete!");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
