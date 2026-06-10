// scripts/migrate-and-update.mjs
// Run: node --env-file=.env.local scripts/migrate-and-update.mjs
import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = false;
const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function main() {
  console.log("🚀 Applying schema changes...\n");

  // Use tagged template literals for DDL — more reliable with Neon
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS name_en varchar(255)`;
  console.log("  ✅ name_en");
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text`;
  console.log("  ✅ address");
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id varchar(20)`;
  console.log("  ✅ tax_id");
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS photo_url text`;
  console.log("  ✅ photo_url");
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS medical_history text`;
  console.log("  ✅ medical_history");

  await sql`ALTER TABLE eye_prescriptions ALTER COLUMN sph_r DROP NOT NULL`;
  await sql`ALTER TABLE eye_prescriptions ALTER COLUMN pd_r DROP NOT NULL`;
  await sql`ALTER TABLE eye_prescriptions ALTER COLUMN sph_l DROP NOT NULL`;
  await sql`ALTER TABLE eye_prescriptions ALTER COLUMN pd_l DROP NOT NULL`;
  console.log("  ✅ rx columns nullable");

  await sql`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS recorder_name varchar(255)`;
  await sql`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS va_r varchar(10)`;
  await sql`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS va_l varchar(10)`;
  await sql`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS old_glasses_notes text`;
  await sql`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS medical_history text`;
  await sql`ALTER TABLE eye_prescriptions ADD COLUMN IF NOT EXISTS frame_type varchar(100)`;
  console.log("  ✅ rx new columns");

  // Verify
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'customers' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  console.log("\n📋 customers now has:", cols.map(c => c.column_name).join(", "));

  const hasNew = cols.some(c => c.column_name === 'name_en');
  if (!hasNew) throw new Error("Migration failed — name_en still missing");

  // Update demo customer
  console.log("\n📝 Updating demo customer...");
  const nameEn = 'Somchai Jaidee';
  const address = '42/7 ถ.สุขุมวิท ซ.22 แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110';
  const taxId = '1234567890123';
  const medHistory = 'แพ้ยากลุ่ม Sulfonamide — มีภาวะความดันในลูกตาสูง (Glaucoma suspect) ติดตามทุก 6 เดือน';
  const phone = '081-999-8888';

  const [cust] = await sql`
    UPDATE customers SET
      name_en = ${nameEn},
      address = ${address},
      tax_id = ${taxId},
      medical_history = ${medHistory}
    WHERE phone = ${phone}
    RETURNING id, name, name_en
  `;
  if (!cust) throw new Error("Customer not found");
  console.log(`  ✅ ${cust.name} / ${cust.name_en}`);

  // Update prescriptions
  const rxRows = await sql`
    SELECT id, recorded_at FROM eye_prescriptions 
    WHERE customer_id = ${cust.id}
    ORDER BY recorded_at DESC
  `;
  console.log(`  Found ${rxRows.length} prescriptions`);

  const rxData = [
    { recorderName: 'ดร.ภัทรา ใจดี', vaR: '6/9',   vaL: '6/6', oldNotes: 'แว่น Oakley Half Jacket ใช้มา 2 ปี เลนส์เริ่มขีดข่วน', med: 'ความดันในลูกตาปกติ (IOP: R=14, L=15 mmHg) ติดตามทุก 6 เดือน', frame: 'Half-rim' },
    { recorderName: 'ดร.สมศักดิ์ รักดี', vaR: '6/9', vaL: '6/6', oldNotes: 'แว่น Ray-Ban Aviator ใช้มาแล้ว 3 ปี', med: 'ตาแห้งเล็กน้อย แนะนำหยอดตาวันละ 3 ครั้ง', frame: 'Full-rim' },
    { recorderName: 'ดร.สมศักดิ์ รักดี', vaR: '6/7.5', vaL: '6/6', oldNotes: null, med: 'ไม่มีโรคประจำตัวทางตา', frame: 'Full-rim' },
  ];

  for (let i = 0; i < Math.min(rxRows.length, rxData.length); i++) {
    const d = rxData[i];
    const rxId = rxRows[i].id;
    await sql`
      UPDATE eye_prescriptions SET
        recorder_name = ${d.recorderName},
        va_r = ${d.vaR},
        va_l = ${d.vaL},
        old_glasses_notes = ${d.oldNotes},
        medical_history = ${d.med},
        frame_type = ${d.frame}
      WHERE id = ${rxId}
    `;
    const yr = new Date(rxRows[i].recorded_at).getFullYear();
    console.log(`  ✅ Rx ${yr}`);
  }

  console.log("\n🎉 Done! ข้อมูลครบสมบูรณ์แล้ว");
  console.log(`\n🔗 https://eyeforcusv2.krittatuch.workers.dev/seller/customers/${cust.id}`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
