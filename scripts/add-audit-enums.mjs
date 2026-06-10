// scripts/add-audit-enums.mjs — Add new audit_action enum values
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
const sql = neon(process.env.DATABASE_URL);

const newValues = [
  "ORDER_DISCOUNT_APPLIED", "ORDER_REFUNDED", "PAYMENT_RECEIVED",
  "SHIFT_OPENED", "SHIFT_CLOSED",
  "STOCK_TRANSFER_CREATED", "STOCK_TRANSFER_RECEIVED",
  "USER_DEACTIVATED", "USER_PASSWORD_RESET",
  "CUSTOMER_PII_VIEWED", "LOYALTY_ADJUSTED",
  "PRESCRIPTION_DELETED",
  "AUTH_LOGIN_FAILED", "AUTH_PASSWORD_CHANGED", "AUTH_LOCKED",
  "LAB_JOB_CREATED", "LAB_STATUS_CHANGED", "LAB_JOB_DELIVERED",
  "BILLING_PAYMENT_SUCCESS", "BILLING_CHARGED",
  "GDPR_ERASE", "AUDIT_LOG_VIEWED", "AUDIT_LOG_EXPORTED",
  "TENANT_PLAN_CHANGED", "TENANT_TRIAL_EXTENDED", "TENANT_DUNNING_RESET",
];

// Check existing via pg_enum (more reliable than enum_range)
const existing = await sql`
  SELECT enumlabel AS val 
  FROM pg_enum e 
  JOIN pg_type t ON t.oid = e.enumtypid 
  WHERE t.typname = 'audit_action'
`;
const existingSet = new Set(existing.map(r => r.val));
console.log(`Existing enum values: ${existingSet.size}`);
console.log([...existingSet].join(", "), "\n");

let added = 0;
for (const val of newValues) {
  if (existingSet.has(val)) {
    console.log(`⏭️  Exists: ${val}`);
  } else {
    try {
      // Use unsafe because ALTER TYPE can't be parameterized
      await sql.unsafe(`ALTER TYPE audit_action ADD VALUE '${val}'`);
      console.log(`✅ Added: ${val}`);
      added++;
    } catch(e) {
      console.error(`❌ Failed ${val}: ${e.message}`);
    }
  }
}

console.log(`\nAdded ${added} new enum values.`);

// Verify via pg_enum
const after = await sql`
  SELECT enumlabel AS val 
  FROM pg_enum e 
  JOIN pg_type t ON t.oid = e.enumtypid 
  WHERE t.typname = 'audit_action'
  ORDER BY enumsortorder
`;
console.log(`\nTotal after: ${after.length} values`);
