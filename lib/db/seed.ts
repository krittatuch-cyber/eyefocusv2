// lib/db/seed.ts — Seed EyeFocus demo data into Neon database
// Run: node -r dotenv/config -e "require('./lib/db/seed.ts')"
// Or: npx tsx lib/db/seed.ts

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("🌱 Starting seed...");

  // ─── 1. Create Tenant ──────────────────────────────────────────────────────
  console.log("Creating tenant...");
  const [tenant] = await db.insert(schema.tenants).values({
    name: "Eye Focus Optical",
    slug: "eyefocus-demo",
    taxId: "0105566123456",
    phone: "02-123-4567",
    address: "123 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
    isActive: true,
    planType: "professional",
  }).returning();

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── 2. Create Branches ────────────────────────────────────────────────────
  console.log("Creating branches...");
  const branchData = [
    { tenantId: tenant.id, name: "สาขาสีลม", code: "SLM", address: "123 ถนนสีลม บางรัก กทม.", phone: "02-234-5678", openTime: "10:00", closeTime: "21:00" },
    { tenantId: tenant.id, name: "สาขาอารีย์", code: "ARY", address: "456 ถนนพหลโยธิน สามเสนใน พญาไท กทม.", phone: "02-345-6789", openTime: "10:00", closeTime: "21:00" },
    { tenantId: tenant.id, name: "สาขาทองหล่อ", code: "TLR", address: "789 ทองหล่อ ซอย 10 วัฒนา กทม.", phone: "02-456-7890", openTime: "11:00", closeTime: "22:00" },
  ];
  const branches = await db.insert(schema.branches).values(branchData).returning();
  console.log(`✅ Branches: ${branches.map(b => b.name).join(", ")}`);

  // ─── 3. Create Users ───────────────────────────────────────────────────────
  console.log("Creating users...");
  const password123456 = await bcrypt.hash("123456", SALT_ROUNDS);
  
  const userData = [
    { tenantId: tenant.id, email: "owner@eyefocus.com", name: "คุณสมชาย ใจดี", passwordHash: password123456, role: "OWNER" as const, branchId: null, phone: "081-234-5678" },
    { tenantId: tenant.id, email: "manager@eyefocus.com", name: "คุณวิภา รักดี", passwordHash: password123456, role: "MANAGER" as const, branchId: branches[0].id, phone: "081-345-6789" },
    { tenantId: tenant.id, email: "manager2@eyefocus.com", name: "คุณอนุชา แก้วสว่าง", passwordHash: password123456, role: "MANAGER" as const, branchId: branches[1].id, phone: "081-456-7890" },
    { tenantId: tenant.id, email: "seller@eyefocus.com", name: "คุณมณี สุวรรณ", passwordHash: password123456, role: "SELLER" as const, branchId: branches[0].id, phone: "081-567-8901" },
    { tenantId: tenant.id, email: "seller2@eyefocus.com", name: "คุณสมหญิง ดีงาม", passwordHash: password123456, role: "SELLER" as const, branchId: branches[0].id, phone: "081-678-9012" },
    { tenantId: tenant.id, email: "seller3@eyefocus.com", name: "คุณประสิทธิ์ ทองคำ", passwordHash: password123456, role: "SELLER" as const, branchId: branches[1].id, phone: "081-789-0123" },
    { tenantId: tenant.id, email: "seller4@eyefocus.com", name: "คุณพิชัย มั่นคง", passwordHash: password123456, role: "SELLER" as const, branchId: branches[2].id, phone: "081-890-1234" },
  ];
  const users = await db.insert(schema.users).values(userData).returning();
  console.log(`✅ Users: ${users.length} users created`);

  // ─── 4. Create Products ────────────────────────────────────────────────────
  console.log("Creating products...");
  const productData = [
    { tenantId: tenant.id, code: "FR001", name: "กรอบ Ray-Ban Aviator Gold", category: "FRAME" as const, brand: "Ray-Ban", model: "RB3025", price: 4500, cost: 1800 },
    { tenantId: tenant.id, code: "FR002", name: "กรอบ Oakley Round O", category: "FRAME" as const, brand: "Oakley", model: "OX8143", price: 5800, cost: 2200 },
    { tenantId: tenant.id, code: "FR003", name: "กรอบ Titanium Ultra Slim", category: "FRAME" as const, brand: "Silhouette", model: "TMA5513", price: 8900, cost: 3500 },
    { tenantId: tenant.id, code: "LS001", name: "เลนส์ Progressive 1.67 Super HD", category: "LENS" as const, brand: "Essilor", model: "Varilux X", price: 6800, cost: 2800 },
    { tenantId: tenant.id, code: "LS002", name: "เลนส์ Blue Cut 1.56 Anti-fatigue", category: "LENS" as const, brand: "Nikon", model: "Relaxsee Neo", price: 2800, cost: 1100 },
    { tenantId: tenant.id, code: "LS003", name: "เลนส์ Single Vision 1.74 Ultra-thin", category: "LENS" as const, brand: "Hoya", model: "IQ Sync", price: 4200, cost: 1700 },
    { tenantId: tenant.id, code: "CL001", name: "คอนแทคเลนส์ Monthly Bio-Infinity", category: "CONTACT_LENS" as const, brand: "Bausch+Lomb", model: "ULTRA", price: 890, cost: 350 },
    { tenantId: tenant.id, code: "CL002", name: "คอนแทคเลนส์ Daily 1-Day Acuvue Oasys", category: "CONTACT_LENS" as const, brand: "J&J", model: "Oasys 1-Day", price: 1290, cost: 520 },
    { tenantId: tenant.id, code: "SG001", name: "แว่นกันแดด Maui Jim Polarized", category: "SUNGLASSES" as const, brand: "Maui Jim", model: "Peahi", price: 12500, cost: 4800 },
    { tenantId: tenant.id, code: "AC001", name: "น้ำยาล้างเลนส์คอนแทค 120ml", category: "ACCESSORY" as const, brand: "ReNu", model: "MPS", price: 290, cost: 90 },
  ];
  const products = await db.insert(schema.products).values(productData).returning();
  console.log(`✅ Products: ${products.length} products created`);

  // ─── 5. Create Stocks ──────────────────────────────────────────────────────
  console.log("Creating stocks...");
  const stockData = branches.flatMap(branch =>
    products.map(product => ({
      tenantId: tenant.id,
      productId: product.id,
      branchId: branch.id,
      quantity: Math.floor(Math.random() * 20) + 2,
      minAlert: product.category === "CONTACT_LENS" ? 10 : 3,
    }))
  );
  await db.insert(schema.stocks).values(stockData);
  console.log(`✅ Stocks: ${stockData.length} stock entries created`);

  // ─── 6. Create Customers ──────────────────────────────────────────────────
  console.log("Creating customers...");
  const customerData = [
    { tenantId: tenant.id, name: "คุณสมหมาย ดวงดี", phone: "081-100-0001", email: "sommai@email.com", gender: "M", loyaltyPoints: 5200, loyaltyTier: "PLATINUM" as const, branchId: branches[0].id },
    { tenantId: tenant.id, name: "คุณประภา รุ่งเรือง", phone: "081-100-0002", email: "prapa@email.com", gender: "F", loyaltyPoints: 1250, loyaltyTier: "GOLD" as const, branchId: branches[0].id },
    { tenantId: tenant.id, name: "คุณวิชัย สุขใจ", phone: "081-100-0003", gender: "M", loyaltyPoints: 450, loyaltyTier: "SILVER" as const, branchId: branches[1].id },
    { tenantId: tenant.id, name: "คุณนารี งามสม", phone: "081-100-0004", email: "naree@email.com", gender: "F", loyaltyPoints: 120, loyaltyTier: "BRONZE" as const, branchId: branches[1].id },
    { tenantId: tenant.id, name: "คุณอาทิตย์ จันทรา", phone: "081-100-0005", gender: "M", loyaltyPoints: 2100, loyaltyTier: "GOLD" as const, branchId: branches[2].id },
  ];
  const customers = await db.insert(schema.customers).values(customerData).returning();
  console.log(`✅ Customers: ${customers.length} customers created`);

  // ─── 7. Audit Logs ────────────────────────────────────────────────────────
  console.log("Creating audit logs...");
  const auditData = [
    { tenantId: tenant.id, userId: users[0].id, userName: users[0].name, action: "SYSTEM_LOGIN" as const, target: "system", detail: "Owner logged in" },
    { tenantId: tenant.id, userId: users[1].id, userName: users[1].name, action: "SHIFT_OPEN" as const, target: "สาขาสีลม", detail: "เปิดกะ เงินเริ่มต้น ฿5,000" },
    { tenantId: tenant.id, userId: users[1].id, userName: users[1].name, action: "ORDER_CREATED" as const, target: "EF-001234", detail: "ออเดอร์ใหม่ ฿8,900" },
  ];
  await db.insert(schema.auditLogs).values(auditData);
  console.log(`✅ Audit logs: ${auditData.length} entries`);

  console.log("\n🎉 Seed completed successfully!");
  console.log(`\nDemo Login Credentials:`);
  console.log(`  Owner:   owner@eyefocus.com / 123456`);
  console.log(`  Manager: manager@eyefocus.com / 123456`);
  console.log(`  Seller:  seller@eyefocus.com / 123456`);
}

main().catch(console.error);
