// scripts/seed-customer-demo.mjs
// ใส่ข้อมูลตัวอย่างลูกค้า พร้อม ค่าสายตา, ประวัติซื้อ, เคลม
// Run: node --env-file=.env.local scripts/seed-customer-demo.mjs

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🌱 Seeding demo customer data...\n");

  // ─── 1. Query existing tenant ─────────────────────────────────────────────
  const tenants = await sql`SELECT id, name FROM tenants LIMIT 1`;
  if (!tenants.length) throw new Error("❌ No tenant found. Run the main seed first.");
  const tenant = tenants[0];
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── 2. Query existing branch ─────────────────────────────────────────────
  const branches = await sql`SELECT id, name FROM branches WHERE tenant_id = ${tenant.id} ORDER BY created_at LIMIT 3`;
  if (!branches.length) throw new Error("❌ No branches found.");
  const branch = branches.find(b => b.name.includes("ทองหล่อ")) || branches[0];
  console.log(`✅ Branch: ${branch.name} (${branch.id})`);

  // ─── 3. Query existing seller user ───────────────────────────────────────
  const sellers = await sql`SELECT id, name FROM users WHERE tenant_id = ${tenant.id} AND role IN ('SELLER','MANAGER','OWNER') LIMIT 5`;
  if (!sellers.length) throw new Error("❌ No users found.");
  const seller = sellers[0];
  console.log(`✅ Seller: ${seller.name} (${seller.id})`);

  // ─── 4. Query existing products ───────────────────────────────────────────
  const products = await sql`SELECT id, name, category, price FROM products WHERE tenant_id = ${tenant.id} LIMIT 10`;
  if (!products.length) throw new Error("❌ No products found. Run the main seed first.");
  console.log(`✅ Products available: ${products.length}`);

  // ─── 5. Query or create shift ─────────────────────────────────────────────
  let shift;
  const existingShifts = await sql`
    SELECT id FROM shifts 
    WHERE tenant_id = ${tenant.id} AND branch_id = ${branch.id} 
    ORDER BY opened_at DESC LIMIT 1
  `;
  if (existingShifts.length) {
    shift = existingShifts[0];
    console.log(`✅ Using existing shift: ${shift.id}`);
  } else {
    const [newShift] = await sql`
      INSERT INTO shifts (tenant_id, user_id, branch_id, starting_cash, status)
      VALUES (${tenant.id}, ${seller.id}, ${branch.id}, 5000, 'OPEN')
      RETURNING id
    `;
    shift = newShift;
    console.log(`✅ Created shift: ${shift.id}`);
  }

  // ─── 6. Check if demo customer already exists ─────────────────────────────
  const existing = await sql`
    SELECT id FROM customers 
    WHERE tenant_id = ${tenant.id} AND phone = '081-999-8888'
    LIMIT 1
  `;
  if (existing.length) {
    console.log(`⚠️  Demo customer already exists (id: ${existing[0].id}). Deleting and re-creating...`);
    await sql`DELETE FROM customers WHERE id = ${existing[0].id}`;
    console.log("   Deleted old demo customer.");
  }

  // ─── 7. Insert Demo Customer (using only existing columns) ────────────────
  console.log("\n📋 Creating demo customer...");
  const [customer] = await sql`
    INSERT INTO customers (
      tenant_id, name, phone, email, line_id,
      gender, birth_date, notes,
      loyalty_points, loyalty_tier, branch_id
    ) VALUES (
      ${tenant.id},
      'สมชาย ใจดีมาก',
      '081-999-8888',
      'somchai.jaidee@gmail.com',
      '@somchai_line',
      'ชาย',
      '1990-03-15 00:00:00'::timestamp,
      'ลูกค้า VIP | ชอบกรอบ Titanium น้ำหนักเบา | แพ้ยา Sulfonamide | ที่อยู่: 42/7 ถ.สุขุมวิท ซ.22 คลองเตย กทม.',
      1250,
      'GOLD',
      ${branch.id}
    )
    RETURNING id, name
  `;
  console.log(`✅ Customer created: ${customer.name} (${customer.id})`);

  // ─── 8. Insert Eye Prescriptions (using only existing columns) ────────────
  console.log("\n👁️  Creating eye prescriptions...");

  // Rx 1 — Latest (2026)
  await sql`
    INSERT INTO eye_prescriptions (
      tenant_id, customer_id, recorded_at,
      sph_r, cyl_r, axis_r, pd_r, add_r,
      sph_l, cyl_l, axis_l, pd_l, add_l,
      notes
    ) VALUES (
      ${tenant.id}, ${customer.id},
      '2026-01-10 10:30:00'::timestamp,
      -2.50, -0.75, 180, 32.0, null,
      -2.00, -0.50, 175, 31.5, null,
      'ผู้บันทึก: ดร.ภัทรา ใจดี | กรอบ: Half-rim | แว่นเดิม: Oakley ใช้มา 2 ปี | ค่าสายตาเปลี่ยนเล็กน้อย แนะนำเปลี่ยนเลนส์'
    )
  `;

  // Rx 2 — Previous (2024)
  await sql`
    INSERT INTO eye_prescriptions (
      tenant_id, customer_id, recorded_at,
      sph_r, cyl_r, axis_r, pd_r, add_r,
      sph_l, cyl_l, axis_l, pd_l, add_l,
      notes
    ) VALUES (
      ${tenant.id}, ${customer.id},
      '2024-06-20 14:00:00'::timestamp,
      -2.25, -0.75, 178, 32.0, null,
      -1.75, -0.50, 172, 31.5, null,
      'ผู้บันทึก: ดร.สมศักดิ์ รักดี | กรอบ: Full-rim | แว่นเดิม: Ray-Ban Aviator ใช้มา 3 ปี | ตาแห้งเล็กน้อย'
    )
  `;

  // Rx 3 — Older (2022)
  await sql`
    INSERT INTO eye_prescriptions (
      tenant_id, customer_id, recorded_at,
      sph_r, cyl_r, axis_r, pd_r, add_r,
      sph_l, cyl_l, axis_l, pd_l, add_l,
      notes
    ) VALUES (
      ${tenant.id}, ${customer.id},
      '2022-03-05 11:00:00'::timestamp,
      -2.00, -0.50, 175, 32.0, null,
      -1.50, -0.25, 170, 31.5, null,
      'ผู้บันทึก: ดร.สมศักดิ์ รักดี | กรอบ: Full-rim | ไม่มีโรคประจำตัวทางตา'
    )
  `;
  console.log("✅ 3 prescriptions created");

  // ─── 9. Insert Orders ────────────────────────────────────────────────────
  console.log("\n🛍️  Creating orders...");

  const getProduct = (cat) => products.find(p => p.category === cat) || products[0];
  const frame = getProduct("FRAME");
  const lens = getProduct("LENS");
  const contact = getProduct("CONTACT_LENS");
  const accessory = getProduct("ACCESSORY") || products[products.length - 1];
  const sunglass = getProduct("SUNGLASSES") || frame;

  // Order 1 — แว่นสายตา + เลนส์ (PAID, CASH)
  const [order1] = await sql`
    INSERT INTO orders (
      tenant_id, order_number, customer_id, seller_id, branch_id, shift_id,
      total_amount, discount_amount, net_amount, paid_amount,
      payment_method, status, notes
    ) VALUES (
      ${tenant.id}, 'EF-20260601-0042', ${customer.id}, ${seller.id}, ${branch.id}, ${shift.id},
      13000, 500, 12500, 12500,
      'CASH', 'PAID',
      'ลูกค้า VIP — ส่วนลดพิเศษ 500 บาท'
    )
    RETURNING id, order_number
  `;
  await sql`
    INSERT INTO order_items (order_id, product_id, quantity, price, discount)
    VALUES 
      (${order1.id}, ${frame.id}, 1, ${frame.price}, 500),
      (${order1.id}, ${lens.id}, 2, ${lens.price}, 0)
  `;
  console.log(`✅ Order 1: ${order1.order_number} — PAID (CASH) ฿12,500`);

  // Order 2 — คอนแทคเลนส์ (PAID, QR)
  const [order2] = await sql`
    INSERT INTO orders (
      tenant_id, order_number, customer_id, seller_id, branch_id, shift_id,
      total_amount, discount_amount, net_amount, paid_amount,
      payment_method, status,
      created_at, updated_at
    ) VALUES (
      ${tenant.id}, 'EF-20260315-0018', ${customer.id}, ${seller.id}, ${branch.id}, ${shift.id},
      2580, 0, 2580, 2580,
      'QR_PROMPTPAY', 'PAID',
      '2026-03-15 13:45:00'::timestamp,
      '2026-03-15 13:45:00'::timestamp
    )
    RETURNING id, order_number
  `;
  await sql`
    INSERT INTO order_items (order_id, product_id, quantity, price, discount)
    VALUES 
      (${order2.id}, ${contact.id}, 2, ${contact.price}, 0),
      (${order2.id}, ${accessory.id}, 1, ${accessory.price}, 0)
  `;
  console.log(`✅ Order 2: ${order2.order_number} — PAID (QR) ฿2,580`);

  // Order 3 — แว่นกันแดด (PAID, CREDIT_CARD)
  const [order3] = await sql`
    INSERT INTO orders (
      tenant_id, order_number, customer_id, seller_id, branch_id, shift_id,
      total_amount, discount_amount, net_amount, paid_amount,
      payment_method, status,
      created_at, updated_at
    ) VALUES (
      ${tenant.id}, 'EF-20251122-0089', ${customer.id}, ${seller.id}, ${branch.id}, ${shift.id},
      ${sunglass.price}, 0, ${sunglass.price}, ${sunglass.price},
      'CREDIT_CARD', 'PAID',
      '2025-11-22 16:20:00'::timestamp,
      '2025-11-22 16:20:00'::timestamp
    )
    RETURNING id, order_number
  `;
  await sql`
    INSERT INTO order_items (order_id, product_id, quantity, price, discount)
    VALUES (${order3.id}, ${sunglass.id}, 1, ${sunglass.price}, 0)
  `;
  console.log(`✅ Order 3: ${order3.order_number} — PAID (CREDIT) ฿${sunglass.price}`);

  // ─── 10. Insert Claims ───────────────────────────────────────────────────
  console.log("\n⚠️  Creating claims...");

  // Claim 1 — Resolved
  await sql`
    INSERT INTO claims (
      tenant_id, order_id, branch_id, customer_id,
      reason, status, resolution,
      created_at, updated_at
    ) VALUES (
      ${tenant.id}, ${order1.id}, ${branch.id}, ${customer.id},
      'เลนส์มีรอยขีดข่วนภายใน 30 วัน ทั้งที่ใช้งานปกติ ไม่ได้ทำหล่น',
      'RESOLVED',
      'เปลี่ยนเลนส์ใหม่ให้โดยไม่คิดค่าใช้จ่าย เนื่องจากเป็นข้อบกพร่องจากโรงงาน',
      '2026-06-05 09:00:00'::timestamp,
      '2026-06-07 11:00:00'::timestamp
    )
  `;

  // Claim 2 — In Review
  await sql`
    INSERT INTO claims (
      tenant_id, order_id, branch_id, customer_id,
      reason, status, resolution,
      created_at, updated_at
    ) VALUES (
      ${tenant.id}, ${order2.id}, ${branch.id}, ${customer.id},
      'คอนแทคเลนส์แพ็คเกจมีรอยรั่ว บางชิ้นแห้งเกินไป ไม่สามารถใช้งานได้',
      'IN_REVIEW',
      null,
      '2026-06-07 08:30:00'::timestamp,
      '2026-06-07 08:30:00'::timestamp
    )
  `;
  console.log("✅ 2 claims created");

  // ─── 11. Summary ─────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(50));
  console.log("🎉 Demo customer seeded successfully!\n");
  console.log(`   Customer ID : ${customer.id}`);
  console.log(`   Name        : ${customer.name}`);
  console.log(`   Phone       : 081-999-8888`);
  console.log(`   Tier        : GOLD (1,250 pts)`);
  console.log(`   Rx records  : 3`);
  console.log(`   Orders      : 3 (all PAID)`);
  console.log(`   Claims      : 2 (1 RESOLVED, 1 IN_REVIEW)`);
  console.log("\n🔗 View at:");
  console.log(`   https://eyeforcusv2.krittatuch.workers.dev/seller/customers/${customer.id}`);
}

main().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
