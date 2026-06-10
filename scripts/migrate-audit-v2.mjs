// scripts/migrate-audit-v2.mjs — EyeFocus V2 Audit Log Schema Upgrade
// Adds 21 new action enum values + 7 new standard columns to audit_logs table
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🚀 EyeFocus V2 — Audit Log Schema Migration (v2)");
  console.log("══════════════════════════════════════════════════\n");

  // ── STEP 1: Get existing enum values ────────────────────────────────────────
  console.log("📋 Checking existing audit_action enum values...");
  let existing;
  try {
    existing = await sql`
      SELECT unnest(enum_range(NULL::audit_action))::text AS val
    `;
  } catch (e) {
    console.error("❌ Could not read audit_action enum:", e.message);
    process.exit(1);
  }
  const existingSet = new Set(existing.map((r) => r.val));
  console.log(`   Found ${existingSet.size} existing values.\n`);

  // ── STEP 2: Add new enum values ──────────────────────────────────────────────
  const newActions = [
    // Orders
    "ORDER_DISCOUNT_APPLIED", "ORDER_REFUNDED", "PAYMENT_RECEIVED",
    // Shifts
    "SHIFT_OPENED", "SHIFT_CLOSED",
    // Stock
    "STOCK_TRANSFER_CREATED", "STOCK_TRANSFER_RECEIVED",
    // Users
    "USER_DEACTIVATED", "USER_PASSWORD_RESET",
    // Customers
    "CUSTOMER_PII_VIEWED", "LOYALTY_ADJUSTED",
    // Prescriptions
    "PRESCRIPTION_DELETED",
    // Auth
    "AUTH_LOGIN_FAILED", "AUTH_PASSWORD_CHANGED", "AUTH_LOCKED",
    // Lab
    "LAB_JOB_CREATED", "LAB_STATUS_CHANGED", "LAB_JOB_DELIVERED",
    // Billing
    "BILLING_PAYMENT_SUCCESS", "BILLING_CHARGED",
    // PDPA
    "GDPR_ERASE", "AUDIT_LOG_VIEWED", "AUDIT_LOG_EXPORTED",
    // Admin
    "TENANT_PLAN_CHANGED", "TENANT_TRIAL_EXTENDED", "TENANT_DUNNING_RESET",
  ];

  console.log("➕ Adding new audit_action enum values...");
  let addedCount = 0;
  for (const val of newActions) {
    if (!existingSet.has(val)) {
      try {
        await sql.unsafe(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '${val}'`);
        console.log(`   ✅ Added: ${val}`);
        addedCount++;
      } catch (e) {
        console.error(`   ❌ Failed to add ${val}:`, e.message);
      }
    } else {
      console.log(`   ⏭️  Exists: ${val}`);
    }
  }
  console.log(`\n   Added ${addedCount} new enum values.\n`);

  // ── STEP 3: Add new columns to audit_logs ────────────────────────────────────
  console.log("📝 Adding new columns to audit_logs...");
  const columns = [
    { stmt: `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(10) NOT NULL DEFAULT 'LOW'`, name: "severity" },
    { stmt: `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role VARCHAR(50)`,                        name: "user_role" },
    { stmt: `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'success'`,name: "status" },
    { stmt: `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)`,                       name: "ip_address" },
    { stmt: `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT`,                              name: "user_agent" },
    { stmt: `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_value JSONB`,                              name: "old_value" },
    { stmt: `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value JSONB`,                              name: "new_value" },
  ];

  for (const col of columns) {
    try {
      await sql.unsafe(col.stmt);
      console.log(`   ✅ Column: ${col.name}`);
    } catch (e) {
      if (e.message?.includes("already exists")) {
        console.log(`   ⏭️  Exists: ${col.name}`);
      } else {
        console.error(`   ❌ Failed: ${col.name} — ${e.message}`);
      }
    }
  }

  // ── STEP 4: Add severity index ────────────────────────────────────────────────
  console.log("\n📊 Adding severity index...");
  try {
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS audit_logs_severity_idx
      ON audit_logs(tenant_id, severity)
    `);
    console.log("   ✅ Index: audit_logs_severity_idx");
  } catch (e) {
    console.log("   ⏭️  Index already exists or skipped:", e.message);
  }

  // ── STEP 5: Verify ────────────────────────────────────────────────────────────
  console.log("\n🔍 Verifying final column list...");
  const cols = await sql`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    ORDER BY ordinal_position
  `;
  for (const c of cols) {
    console.log(`   • ${c.column_name.padEnd(20)} ${c.data_type}`);
  }

  const finalEnum = await sql`
    SELECT unnest(enum_range(NULL::audit_action))::text AS val
  `;
  console.log(`\n📊 Total audit_action enum values: ${finalEnum.length}`);

  console.log("\n✨ Migration complete!\n");
}

main().catch((err) => {
  console.error("💥 Migration failed:", err);
  process.exit(1);
});
