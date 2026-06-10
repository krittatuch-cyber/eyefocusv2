// scripts/final-update.mjs
// อัปเดต demo customer หลัง migration เสร็จแล้ว
// Run: node --env-file=.env.local scripts/final-update.mjs

import { neon } from "@neondatabase/serverless";

const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function q(query) {
  const r = await sql.unsafe(query);
  return Array.isArray(r) ? r : Array.from(r);
}

async function main() {
  console.log("🔍 Checking actual columns in DB...\n");

  // Use pg_catalog instead of information_schema to avoid schema issues
  const custCols = await q(`
    SELECT attname 
    FROM pg_catalog.pg_attribute 
    WHERE attrelid = 'customers'::regclass 
      AND attnum > 0 AND NOT attisdropped
    ORDER BY attnum
  `);
  console.log("customers columns:", custCols.map(r => r.attname).join(", "));

  const hasNameEn = custCols.some(r => r.attname === 'name_en');
  console.log("has name_en:", hasNameEn);

  if (!hasNameEn) {
    console.log("\n⚠️  Columns still not present! Running ALTER TABLE...");
    await q(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS name_en varchar(255)`);
    await q(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text`);
    await q(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id varchar(20)`);
    await q(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS photo_url text`);
    await q(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS medical_history text`);
    await q(`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS recorder_name varchar(255)`);
    await q(`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS va_r varchar(10)`);
    await q(`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS va_l varchar(10)`);
    await q(`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS old_glasses_notes text`);
    await q(`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS medical_history text`);
    await q(`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS frame_type varchar(100)`);
    console.log("✅ ALTER TABLE done");
  }

  // Update customer using parameterized values
  console.log("\n📝 Updating demo customer...");
  const updated = await q(`
    UPDATE customers SET
      name_en = 'Somchai Jaidee',
      address = '42/7 ถ.สุขุมวิท ซ.22 แขวงคลองเตย เขตคลองเตย กทม. 10110',
      tax_id = '1234567890123',
      medical_history = 'แพ้ยากลุ่ม Sulfonamide — มีภาวะความดันในลูกตาสูง (Glaucoma suspect) ติดตามทุก 6 เดือน'
    WHERE phone = '081-999-8888'
    RETURNING id, name, name_en
  `);

  if (!updated.length) {
    console.log("⚠️  Demo customer not found!");
    return;
  }

  const custId = updated[0].id;
  console.log(`✅ Customer: ${updated[0].name} / ${updated[0].name_en}`);

  // Update prescriptions
  const rxRows = await q(`
    SELECT id, recorded_at FROM eye_prescriptions 
    WHERE customer_id = '${custId}'
    ORDER BY recorded_at DESC
  `);
  console.log(`Found ${rxRows.length} prescriptions`);

  const rxData = [
    { recorder: 'ดร.ภัทรา ใจดี', vaR: '6/9',   vaL: '6/6', old: 'แว่น Oakley Half Jacket ใช้มา 2 ปี เลนส์เริ่มขีดข่วน', med: 'ความดันในลูกตาปกติ (IOP: R=14, L=15 mmHg)', frame: 'Half-rim' },
    { recorder: 'ดร.สมศักดิ์ รักดี', vaR: '6/9', vaL: '6/6', old: 'แว่น Ray-Ban Aviator ใช้มาแล้ว 3 ปี', med: 'ตาแห้งเล็กน้อย แนะนำหยอดตาวันละ 3 ครั้ง', frame: 'Full-rim' },
    { recorder: 'ดร.สมศักดิ์ รักดี', vaR: '6/7.5', vaL: '6/6', old: null, med: 'ไม่มีโรคประจำตัวทางตา', frame: 'Full-rim' },
  ];

  for (let i = 0; i < Math.min(rxRows.length, rxData.length); i++) {
    const d = rxData[i];
    const oldEscaped = d.old ? `'${d.old.replace(/'/g, "''")}'` : 'NULL';
    const medEscaped = d.med ? `'${d.med.replace(/'/g, "''")}'` : 'NULL';
    await q(`
      UPDATE eye_prescriptions SET
        recorder_name = '${d.recorder}',
        va_r = '${d.vaR}', va_l = '${d.vaL}',
        old_glasses_notes = ${oldEscaped},
        medical_history = ${medEscaped},
        frame_type = '${d.frame}'
      WHERE id = '${rxRows[i].id}'
    `);
    const yr = new Date(rxRows[i].recorded_at).getFullYear();
    console.log(`  ✅ Rx ${yr} updated`);
  }

  console.log("\n🎉 All done!");
  console.log(`\n🔗 https://eyeforcusv2.krittatuch.workers.dev/seller/customers/${custId}`);
}

main().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
