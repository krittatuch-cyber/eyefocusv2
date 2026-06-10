// scripts/migrate-audit-actions.mjs — Add new audit_action enum values
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const url = process.env.DATABASE_URL.replace("-pooler", "");
const pool = new Pool({ connectionString: url, max: 1 });

const NEW_VALUES = [
  "PRESCRIPTION_CREATED",
  "PRESCRIPTION_UPDATED",
  "USER_ROLE_CHANGED",
  "PRODUCT_CREATED",
  "PRODUCT_DELETED",
  "CUSTOMER_DELETED",
  "BILLING_SUBSCRIBE",
  "BILLING_FAILED",
  "TENANT_SUSPENDED",
  "TENANT_ACTIVATED",
  "PLAN_CHANGED",
  "TRIAL_EXTENDED",
  "GDPR_EXPORT",
  "GDPR_ERASE_REQUEST",
  "SYSTEM_LOGOUT",
];

async function run() {
  const client = await pool.connect();
  console.log("🔗 Connected\n");

  let ok = 0;
  for (const val of NEW_VALUES) {
    try {
      await client.query(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '${val}'`);
      console.log(`✅ ${val}`);
      ok++;
    } catch (e) {
      if (e.message?.includes("already exists")) { console.log(`⏭️  ${val}`); ok++; }
      else console.error(`❌ ${val}: ${e.message}`);
    }
  }

  // Verify
  const { rows } = await client.query(`SELECT unnest(enum_range(NULL::audit_action))::text AS val ORDER BY val`);
  console.log(`\n📋 All enum values (${rows.length}):`);
  rows.forEach(r => console.log(`  ${r.val}`));

  await client.release();
  await pool.end();
  console.log(`\n✨ Done! ${ok}/${NEW_VALUES.length} OK`);
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
