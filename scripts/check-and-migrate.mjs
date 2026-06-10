// scripts/check-and-migrate.mjs
// ตรวจสอบและ migrate ด้วย direct connection เท่านั้น
// Run: node --env-file=.env.local scripts/check-and-migrate.mjs

import { neon } from "@neondatabase/serverless";

// Direct connection (no pooler)
const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
console.log("Using URL:", directUrl.substring(0, 50) + "...");
const sql = neon(directUrl);

async function runSQL(label, query) {
  try {
    await sql.unsafe(query);
    process.stdout.write(`  ✅ ${label}\n`);
  } catch (e) {
    process.stdout.write(`  ⚠️  ${label}: ${e.message}\n`);
  }
}

async function main() {
  // Step 1: Apply all migrations
  console.log("\n🔧 Applying migrations...");
  await runSQL("customers.name_en", `ALTER TABLE customers ADD COLUMN IF NOT EXISTS name_en varchar(255)`);
  await runSQL("customers.address", `ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text`);
  await runSQL("customers.tax_id", `ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id varchar(20)`);
  await runSQL("customers.photo_url", `ALTER TABLE customers ADD COLUMN IF NOT EXISTS photo_url text`);
  await runSQL("customers.medical_history", `ALTER TABLE customers ADD COLUMN IF NOT EXISTS medical_history text`);
  await runSQL("rx.sph_r nullable", `ALTER TABLE eye_prescriptions ALTER COLUMN sph_r DROP NOT NULL`);
  await runSQL("rx.pd_r nullable", `ALTER TABLE eye_prescriptions ALTER COLUMN pd_r DROP NOT NULL`);
  await runSQL("rx.sph_l nullable", `ALTER TABLE eye_prescriptions ALTER COLUMN sph_l DROP NOT NULL`);
  await runSQL("rx.pd_l nullable", `ALTER TABLE eye_prescriptions ALTER COLUMN pd_l DROP NOT NULL`);
  await runSQL("rx.recorder_name", `ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS recorder_name varchar(255)`);
  await runSQL("rx.va_r", `ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS va_r varchar(10)`);
  await runSQL("rx.va_l", `ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS va_l varchar(10)`);
  await runSQL("rx.old_glasses_notes", `ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS old_glasses_notes text`);
  await runSQL("rx.medical_history", `ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS medical_history text`);
  await runSQL("rx.frame_type", `ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS frame_type varchar(100)`);

  // Step 2: Verify columns exist now
  console.log("\n🔍 Verifying columns...");
  const colsRaw = await sql.unsafe(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'customers' 
    ORDER BY ordinal_position
  `);
  const cols = Array.from(colsRaw);
  console.log("  customers:", cols.map(c => c.column_name).join(", "));

  const rxColsRaw = await sql.unsafe(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'eye_prescriptions' 
    ORDER BY ordinal_position
  `);
  const rxCols = Array.from(rxColsRaw);
  console.log("  eye_prescriptions:", rxCols.map(c => c.column_name).join(", "));

  // Step 3: Update demo customer
  const hasNewCols = cols.some(c => c.column_name === 'name_en');
  if (!hasNewCols) {
    throw new Error("Columns still missing after migration!");
  }

  console.log("\n📝 Updating demo customer...");
  const custResultRaw = await sql.unsafe(`
    UPDATE customers SET
      name_en = 'Somchai Jaidee',
      address = '42/7 ถ.สุขุมวิท ซ.22 แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
      tax_id = '1234567890123',
      medical_history = 'แพ้ยากลุ่ม Sulfonamide — มีภาวะความดันในลูกตาสูง (Glaucoma suspect) ติดตามทุก 6 เดือน'
    WHERE phone = '081-999-8888'
    RETURNING id, name, name_en
  `);
  const custResult = Array.from(custResultRaw);
  if (custResult.length) {
    console.log(`  ✅ Customer: ${custResult[0].name} / ${custResult[0].name_en}`);
    const custId = custResult[0].id;

    // Update prescriptions
    const rxResultRaw = await sql.unsafe(`
      SELECT id, recorded_at FROM eye_prescriptions 
      WHERE customer_id = '${custId}'
      ORDER BY recorded_at DESC
    `);
    const rxResult = Array.from(rxResultRaw);
    console.log(`  Found ${rxResult.length} prescriptions`);

    const rxUpdates = [
      { recorder: 'ดร.ภัทรา ใจดี', vaR: '6/9', vaL: '6/6', old: 'แว่น Oakley Half Jacket ใช้มา 2 ปี เลนส์เริ่มขีดข่วน', med: 'ความดันในลูกตาปกติ (IOP: R=14, L=15 mmHg) ติดตามทุก 6 เดือน', frame: 'Half-rim' },
      { recorder: 'ดร.สมศักดิ์ รักดี', vaR: '6/9', vaL: '6/6', old: 'แว่น Ray-Ban Aviator ใช้มาแล้ว 3 ปี', med: 'ตาแห้งเล็กน้อย แนะนำหยอดตาวันละ 3 ครั้ง', frame: 'Full-rim' },
      { recorder: 'ดร.สมศักดิ์ รักดี', vaR: '6/7.5', vaL: '6/6', old: null, med: 'ไม่มีโรคประจำตัวทางตา', frame: 'Full-rim' },
    ];

    for (let i = 0; i < Math.min(rxResult.length, rxUpdates.length); i++) {
      const u = rxUpdates[i];
      const oldVal = u.old ? `'${u.old}'` : 'NULL';
      await sql.unsafe(`
        UPDATE eye_prescriptions SET
          recorder_name = '${u.recorder}',
          va_r = '${u.vaR}', va_l = '${u.vaL}',
          old_glasses_notes = ${oldVal},
          medical_history = '${u.med}',
          frame_type = '${u.frame}'
        WHERE id = '${rxResult[i].id}'
      `);
      const year = new Date(rxResult[i].recorded_at).getFullYear();
      console.log(`  ✅ Rx ${year} updated`);
    }

    console.log(`\n🎉 Done!`);
    console.log(`\n🔗 https://eyeforcusv2.krittatuch.workers.dev/seller/customers/${custId}`);
  } else {
    console.log("  ⚠️  No demo customer found (phone: 081-999-8888)");
  }
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
