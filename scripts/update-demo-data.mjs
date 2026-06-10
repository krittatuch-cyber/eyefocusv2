// scripts/update-demo-data.mjs
// อัปเดต demo customer หลัง migration
// Run: node --env-file=.env.local scripts/update-demo-data.mjs

import { neon } from "@neondatabase/serverless";

// ตัด -pooler ออก → direct connection ไม่มี connection pooling
const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function main() {
  console.log("📝 Updating demo customer with full data...\n");

  // Verify columns exist first
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name IN ('name_en','address','tax_id','medical_history')
    ORDER BY column_name
  `;
  console.log("Columns confirmed:", cols.map(c => c.column_name).join(", "));

  if (cols.length < 4) {
    throw new Error("Columns not found — migration may not have applied yet");
  }

  // Update customer
  const [cust] = await sql`
    UPDATE customers SET
      name_en = 'Somchai Jaidee',
      address = '42/7 ถ.สุขุมวิท ซ.22 แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
      tax_id = '1234567890123',
      medical_history = 'แพ้ยากลุ่ม Sulfonamide — มีภาวะความดันในลูกตาสูง (Glaucoma suspect) ติดตามทุก 6 เดือน'
    WHERE phone = '081-999-8888'
    RETURNING id, name, name_en, address
  `;
  console.log(`✅ Customer: ${cust.name} (${cust.name_en})`);

  // Update prescriptions
  const rxCols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'eye_prescriptions' AND column_name IN ('recorder_name','va_r','va_l','old_glasses_notes','frame_type')
    ORDER BY column_name
  `;
  console.log("Rx columns confirmed:", rxCols.map(c => c.column_name).join(", "));

  const rxList = await sql`
    SELECT ep.id, ep.recorded_at 
    FROM eye_prescriptions ep
    JOIN customers c ON ep.customer_id = c.id
    WHERE c.phone = '081-999-8888'
    ORDER BY ep.recorded_at DESC
  `;
  console.log(`Found ${rxList.length} prescriptions`);

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

  console.log("\n🎉 All data updated!");
  console.log(`\n🔗 https://eyeforcusv2.krittatuch.workers.dev/seller/customers/${cust.id}`);
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
