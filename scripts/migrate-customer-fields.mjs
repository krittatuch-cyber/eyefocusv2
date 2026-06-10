// scripts/migrate-customer-fields.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const migrations = [
  // Customers — new columns
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "name_en" varchar(255)`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "address" text`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tax_id" varchar(20)`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "photo_url" text`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "medical_history" text`,

  // Eye prescriptions — make notNull fields nullable (optional now)
  `ALTER TABLE "eye_prescriptions" ALTER COLUMN "sph_r" DROP NOT NULL`,
  `ALTER TABLE "eye_prescriptions" ALTER COLUMN "pd_r" DROP NOT NULL`,
  `ALTER TABLE "eye_prescriptions" ALTER COLUMN "sph_l" DROP NOT NULL`,
  `ALTER TABLE "eye_prescriptions" ALTER COLUMN "pd_l" DROP NOT NULL`,

  // Eye prescriptions — new columns
  `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "recorder_name" varchar(255)`,
  `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "va_r" varchar(10)`,
  `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "va_l" varchar(10)`,
  `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "old_glasses_notes" text`,
  `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "medical_history" text`,
  `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "frame_type" varchar(100)`,
];

async function run() {
  console.log(`Running ${migrations.length} migrations...`);
  for (const stmt of migrations) {
    try {
      await sql.unsafe(stmt);
      console.log("✓", stmt.slice(0, 70));
    } catch (err) {
      console.error("✗", stmt.slice(0, 70));
      console.error("  Error:", err.message);
    }
  }
  console.log("\nMigration complete!");
}

run();
