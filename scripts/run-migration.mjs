// scripts/run-migration.mjs
// Applies missing columns to live Neon DB
// Run: node --env-file=.env.local scripts/run-migration.mjs

import { neon } from "@neondatabase/serverless";

// Use direct (non-pooler) connection to avoid schema cache issues after ALTER TABLE
const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function main() {
  console.log("🚀 Running schema migration...\n");

  const migrations = [
    // ─── customers: new columns ──────────────────────────────────────────────
    {
      name: "customers.name_en",
      sql: `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "name_en" varchar(255)`,
    },
    {
      name: "customers.address",
      sql: `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "address" text`,
    },
    {
      name: "customers.tax_id",
      sql: `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tax_id" varchar(20)`,
    },
    {
      name: "customers.photo_url",
      sql: `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "photo_url" text`,
    },
    {
      name: "customers.medical_history",
      sql: `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "medical_history" text`,
    },

    // ─── eye_prescriptions: make nullable ─────────────────────────────────────
    {
      name: "eye_prescriptions.sph_r nullable",
      sql: `ALTER TABLE "eye_prescriptions" ALTER COLUMN "sph_r" DROP NOT NULL`,
    },
    {
      name: "eye_prescriptions.pd_r nullable",
      sql: `ALTER TABLE "eye_prescriptions" ALTER COLUMN "pd_r" DROP NOT NULL`,
    },
    {
      name: "eye_prescriptions.sph_l nullable",
      sql: `ALTER TABLE "eye_prescriptions" ALTER COLUMN "sph_l" DROP NOT NULL`,
    },
    {
      name: "eye_prescriptions.pd_l nullable",
      sql: `ALTER TABLE "eye_prescriptions" ALTER COLUMN "pd_l" DROP NOT NULL`,
    },

    // ─── eye_prescriptions: new columns ──────────────────────────────────────
    {
      name: "eye_prescriptions.recorder_name",
      sql: `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "recorder_name" varchar(255)`,
    },
    {
      name: "eye_prescriptions.va_r",
      sql: `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "va_r" varchar(10)`,
    },
    {
      name: "eye_prescriptions.va_l",
      sql: `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "va_l" varchar(10)`,
    },
    {
      name: "eye_prescriptions.old_glasses_notes",
      sql: `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "old_glasses_notes" text`,
    },
    {
      name: "eye_prescriptions.medical_history",
      sql: `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "medical_history" text`,
    },
    {
      name: "eye_prescriptions.frame_type",
      sql: `ALTER TABLE "eye_prescriptions" ADD COLUMN IF NOT EXISTS "frame_type" varchar(100)`,
    },
  ];

  let success = 0;
  for (const migration of migrations) {
    try {
      await sql.unsafe(migration.sql);
      console.log(`  ✅ ${migration.name}`);
      success++;
    } catch (err) {
      console.log(`  ⚠️  ${migration.name} — ${err.message}`);
    }
  }

  console.log(`\n✨ Migration complete: ${success}/${migrations.length} statements applied`);

  // ─── Update demo customer with new fields ─────────────────────────────────
  console.log("\n📝 Updating demo customer with new field data...");
  const updated = await sql`
    UPDATE customers 
    SET 
      name_en = 'Somchai Jaidee',
      address = '42/7 ถ.สุขุมวิท ซ.22 แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
      tax_id = '1234567890123',
      medical_history = 'แพ้ยากลุ่ม Sulfonamide — มีภาวะความดันในลูกตาสูง (Glaucoma suspect) ติดตามทุก 6 เดือน'
    WHERE phone = '081-999-8888'
    RETURNING id, name, name_en
  `;
  if (updated.length) {
    console.log(`  ✅ Customer updated: ${updated[0].name} / ${updated[0].name_en}`);
  }

  // ─── Update prescriptions with new fields ─────────────────────────────────
  console.log("\n📝 Updating prescriptions with recorder/VA/frame data...");

  // Get prescription IDs for this customer
  const rxList = await sql`
    SELECT ep.id, ep.recorded_at 
    FROM eye_prescriptions ep
    JOIN customers c ON ep.customer_id = c.id
    WHERE c.phone = '081-999-8888'
    ORDER BY ep.recorded_at DESC
  `;

  if (rxList.length >= 1) {
    await sql`
      UPDATE eye_prescriptions SET
        recorder_name = 'ดร.ภัทรา ใจดี',
        va_r = '6/9', va_l = '6/6',
        old_glasses_notes = 'แว่น Oakley Half Jacket ใช้มา 2 ปี เลนส์เริ่มขีดข่วน',
        medical_history = 'ความดันในลูกตาปกติ (IOP: R=14, L=15 mmHg) ติดตามทุก 6 เดือน',
        frame_type = 'Half-rim'
      WHERE id = ${rxList[0].id}
    `;
    console.log("  ✅ Rx 2026 updated");
  }

  if (rxList.length >= 2) {
    await sql`
      UPDATE eye_prescriptions SET
        recorder_name = 'ดร.สมศักดิ์ รักดี',
        va_r = '6/9', va_l = '6/6',
        old_glasses_notes = 'แว่น Ray-Ban Aviator ใช้มาแล้ว 3 ปี',
        medical_history = 'ตาแห้งเล็กน้อย แนะนำหยอดตาวันละ 3 ครั้ง',
        frame_type = 'Full-rim'
      WHERE id = ${rxList[1].id}
    `;
    console.log("  ✅ Rx 2024 updated");
  }

  if (rxList.length >= 3) {
    await sql`
      UPDATE eye_prescriptions SET
        recorder_name = 'ดร.สมศักดิ์ รักดี',
        va_r = '6/7.5', va_l = '6/6',
        old_glasses_notes = null,
        medical_history = 'ไม่มีโรคประจำตัวทางตา',
        frame_type = 'Full-rim'
      WHERE id = ${rxList[2].id}
    `;
    console.log("  ✅ Rx 2022 updated");
  }

  console.log("\n🎉 All done!");
  console.log("\n🔗 View at:");
  const cust = await sql`SELECT id FROM customers WHERE phone = '081-999-8888' LIMIT 1`;
  if (cust.length) {
    console.log(`   https://eyeforcusv2.krittatuch.workers.dev/seller/customers/${cust[0].id}`);
  }
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
