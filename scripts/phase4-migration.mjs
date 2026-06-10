// scripts/phase4-migration.mjs — Phase 4: Security & Hardening DB changes
// Adds: ip_address + user_agent to audit_logs, consent columns to customers
// Run: node --env-file=.env.local scripts/phase4-migration.mjs
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
  console.log("🚀 EyeFocus Phase 4 — Security & Hardening Migration\n");

  // G1: Enhanced audit log
  await safe("audit_logs.ip_address", () =>
    sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)`);
  await safe("audit_logs.user_agent", () =>
    sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT`);
  await safe("audit_logs.metadata", () =>
    sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB`);

  // G3: PDPA — customer consent tracking
  await safe("customers.pdpa_consent", () =>
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS pdpa_consent BOOLEAN NOT NULL DEFAULT false`);
  await safe("customers.consent_date", () =>
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ`);
  await safe("customers.data_erasure_requested_at", () =>
    sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS data_erasure_requested_at TIMESTAMPTZ`);

  // G2: Tenant-level security settings
  await safe("tenants.require_2fa", () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS require_2fa BOOLEAN NOT NULL DEFAULT false`);
  await safe("tenants.ip_allowlist", () =>
    sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ip_allowlist TEXT`); // comma-separated CIDRs

  // Verify
  const auditCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='audit_logs' AND table_schema='public' ORDER BY ordinal_position`;
  console.log("\n📋 audit_logs columns:", auditCols.map(r=>r.column_name).join(", "));
  console.log("\n🎉 Phase 4 migration complete!");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
