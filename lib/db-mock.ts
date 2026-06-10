// lib/db-mock.ts — EyeFocus V2 Complete Mock Database

export interface MockDb {
  branches: any[];
  users: any[];
  shifts: any[];
  customers: any[];
  eyePrescriptions: any[];
  products: any[];
  stocks: any[];
  orders: any[];
  orderItems: any[];
  appointments: any[];
  appointmentItems: any[];
  jobTickets: any[];
  installments: any[];
  claims: any[];
  stockTransfers: any[];
  suppliers: any[];
  labVendors: any[];
  commissionRules: any[];
  auditLogs: any[];
}

// ─── BRANCHES ──────────────────────────────────────────────
const initialBranches = [
  { id: "b1", name: "สาขาลาดพร้าว", code: "L01", address: "เซ็นทรัลลาดพร้าว ชั้น 3 ห้อง 3025 ถนนลาดพร้าว แขวงจตุจักร", phone: "02-111-2222", isActive: true, openTime: "10:00", closeTime: "22:00", createdAt: new Date("2023-01-15"), updatedAt: new Date() },
  { id: "b2", name: "สาขาสยามพารากอน", code: "S01", address: "สยามพารากอน ชั้น 2 ห้อง M228 ถนนพระราม 1 แขวงปทุมวัน", phone: "02-333-4444", isActive: true, openTime: "10:00", closeTime: "22:00", createdAt: new Date("2023-03-20"), updatedAt: new Date() },
  { id: "b3", name: "สาขาพระราม 9", code: "R01", address: "เซ็นทรัลพระราม 9 ชั้น B1 ห้อง B105 ถนนพระราม 9 แขวงห้วยขวาง", phone: "02-555-6666", isActive: true, openTime: "10:00", closeTime: "22:00", createdAt: new Date("2024-06-01"), updatedAt: new Date() }
];

// ─── USERS ──────────────────────────────────────────────────
const initialUsers = [
  { id: "u1", email: "owner@eyefocus.com",    name: "คุณสมชาย ใจดี",         passwordHash: "123456", role: "OWNER",   isActive: true, branchId: null, phone: "081-000-0001", createdAt: new Date("2023-01-10"), updatedAt: new Date() },
  { id: "u2", email: "manager@eyefocus.com",  name: "คุณสมศรี สุขใจ",        passwordHash: "123456", role: "MANAGER", isActive: true, branchId: "b1", phone: "081-000-0002", createdAt: new Date("2023-01-20"), updatedAt: new Date() },
  { id: "u3", email: "seller@eyefocus.com",   name: "คุณสมพร หน้าร้าน",      passwordHash: "123456", role: "SELLER",  isActive: true, branchId: "b1", phone: "081-000-0003", createdAt: new Date("2023-02-01"), updatedAt: new Date() },
  { id: "u4", email: "seller2@eyefocus.com",  name: "คุณสมบัติ สยามพารากอน", passwordHash: "123456", role: "SELLER",  isActive: true, branchId: "b2", phone: "081-000-0004", createdAt: new Date("2023-04-01"), updatedAt: new Date() },
  { id: "u5", email: "manager2@eyefocus.com", name: "คุณสมหวัง พระราม9",      passwordHash: "123456", role: "MANAGER", isActive: true, branchId: "b3", phone: "081-000-0005", createdAt: new Date("2024-06-05"), updatedAt: new Date() },
  { id: "u6", email: "seller3@eyefocus.com",  name: "คุณนารี ดีใจ",          passwordHash: "123456", role: "SELLER",  isActive: true, branchId: "b1", phone: "081-000-0006", createdAt: new Date("2023-05-15"), updatedAt: new Date() },
  { id: "u7", email: "seller4@eyefocus.com",  name: "คุณวิทยา เรียนไว",      passwordHash: "123456", role: "SELLER",  isActive: true, branchId: "b2", phone: "081-000-0007", createdAt: new Date("2024-01-10"), updatedAt: new Date() },
];

// ─── PRODUCTS ───────────────────────────────────────────────
const initialProducts = [
  // FRAME — Luxury
  { id: "p1",  code: "FR-GUC-001", name: "Gucci Square Frame GG0025O",           category: "FRAME",         brand: "Gucci",     model: "GG0025O",           price: 8500,  cost: 4200, createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p2",  code: "FR-RAY-002", name: "Ray-Ban Clubmaster RX5154",            category: "FRAME",         brand: "Ray-Ban",   model: "RX5154",            price: 5200,  cost: 2600, createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p3",  code: "FR-OAK-003", name: "Oakley Holbrook OX8156",               category: "FRAME",         brand: "Oakley",    model: "OX8156",            price: 6100,  cost: 3100, createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p4",  code: "FR-TOM-004", name: "Tom Ford Classic Round FT5784-B",      category: "FRAME",         brand: "Tom Ford",  model: "FT5784-B",          price: 9800,  cost: 5000, createdAt: new Date("2023-06-01"), updatedAt: new Date() },
  { id: "p5",  code: "FR-LIN-005", name: "Lindberg Spirit Titanium 1049",        category: "FRAME",         brand: "Lindberg",  model: "Spirit 1049",       price: 14500, cost: 7500, createdAt: new Date("2023-06-01"), updatedAt: new Date() },
  { id: "p6",  code: "FR-PRS-006", name: "Persol PO3007V Classic Oval",          category: "FRAME",         brand: "Persol",    model: "PO3007V",           price: 7200,  cost: 3600, createdAt: new Date("2024-01-01"), updatedAt: new Date() },
  { id: "p7",  code: "FR-JIN-007", name: "Silhouette Titan Minimal 2926",        category: "FRAME",         brand: "Silhouette",model: "Titan 2926",        price: 11000, cost: 5500, createdAt: new Date("2024-01-01"), updatedAt: new Date() },
  // FRAME — Economy
  { id: "p8",  code: "FR-EYE-008", name: "EyeFocus Basic Rectangle EB-101",      category: "FRAME",         brand: "EyeFocus",  model: "EB-101",            price: 1200,  cost: 400,  createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p9",  code: "FR-EYE-009", name: "EyeFocus Round Wire EB-205",           category: "FRAME",         brand: "EyeFocus",  model: "EB-205",            price: 990,   cost: 320,  createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  // LENS — Single Vision
  { id: "p10", code: "LN-HOY-156", name: "Hoya Nulux 1.56 BlueControl",          category: "LENS",          brand: "Hoya",      model: "Nulux 1.56 BC",     price: 2500,  cost: 980,  createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p11", code: "LN-HOY-167", name: "Hoya Nulux 1.67 HiVision Longlife",    category: "LENS",          brand: "Hoya",      model: "Nulux 1.67 HVL",    price: 4200,  cost: 1800, createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p12", code: "LN-HOY-174", name: "Hoya Phoenix 1.74 Hilux WR",           category: "LENS",          brand: "Hoya",      model: "Phoenix 1.74 WR",   price: 6800,  cost: 3000, createdAt: new Date("2023-06-01"), updatedAt: new Date() },
  // LENS — Progressive
  { id: "p13", code: "LN-ESS-TRA", name: "Essilor Crizal Transitions 1.60",      category: "LENS",          brand: "Essilor",   model: "Crizal Transitions",price: 7800,  cost: 3800, createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p14", code: "LN-ESS-VAR", name: "Essilor Varilux Physio 3.0 1.67",      category: "LENS",          brand: "Essilor",   model: "Varilux Physio 3.0",price: 12500, cost: 6200, createdAt: new Date("2023-06-01"), updatedAt: new Date() },
  { id: "p15", code: "LN-HOY-IDS", name: "Hoya iD MyStyle V+ 1.60",              category: "LENS",          brand: "Hoya",      model: "iD MyStyle V+",     price: 9800,  cost: 4800, createdAt: new Date("2024-01-01"), updatedAt: new Date() },
  // LENS — Basic
  { id: "p16", code: "LN-EYE-150", name: "EyeFocus Standard 1.50 AR Coat",       category: "LENS",          brand: "EyeFocus",  model: "Standard 1.50",     price: 890,   cost: 280,  createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  // CONTACT LENS
  { id: "p17", code: "CL-ACU-MOI", name: "1-Day Acuvue Moist (30 Pack)",         category: "CONTACT_LENS",  brand: "Acuvue",    model: "Moist 1-Day",       price: 1250,  cost: 850,  createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p18", code: "CL-ACU-TRU", name: "1-Day Acuvue TruEye (30 Pack)",        category: "CONTACT_LENS",  brand: "Acuvue",    model: "TruEye 1-Day",      price: 1450,  cost: 980,  createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p19", code: "CL-AIR-OPT", name: "Air Optix Night & Day (6 Pack)",       category: "CONTACT_LENS",  brand: "Alcon",     model: "Night & Day",       price: 2100,  cost: 1400, createdAt: new Date("2023-06-01"), updatedAt: new Date() },
  { id: "p20", code: "CL-BIO-SUP", name: "Biofinity Multifocal (6 Pack)",        category: "CONTACT_LENS",  brand: "CooperVision",model: "Biofinity MF",    price: 2800,  cost: 1900, createdAt: new Date("2024-01-01"), updatedAt: new Date() },
  // SUNGLASSES
  { id: "p21", code: "SG-RAY-WAY", name: "Ray-Ban Wayfarer RB2132 Polarized",    category: "SUNGLASSES",    brand: "Ray-Ban",   model: "RB2132",            price: 5800,  cost: 2900, createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p22", code: "SG-OAK-FRG", name: "Oakley Frogskins OO9013 Prizm",        category: "SUNGLASSES",    brand: "Oakley",    model: "Frogskins OO9013",  price: 6500,  cost: 3200, createdAt: new Date("2023-06-01"), updatedAt: new Date() },
  // ACCESSORIES
  { id: "p23", code: "AC-CLE-100", name: "สเปรย์ทำความสะอาดเลนส์ EyeFocus 100ml",category: "ACCESSORY",    brand: "EyeFocus",  model: "Lens Cleaner",      price: 150,   cost: 45,   createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p24", code: "AC-CAS-STD", name: "กล่องแว่นตาหนังนิ่ม Hard Case Premium", category: "ACCESSORY",   brand: "EyeFocus",  model: "Premium Hard Case", price: 390,   cost: 120,  createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "p25", code: "AC-CHN-STD", name: "สายคล้องแว่นตา Anti-Slip Silicone",    category: "ACCESSORY",    brand: "EyeFocus",  model: "Anti-Slip Chain",   price: 120,   cost: 35,   createdAt: new Date("2023-01-01"), updatedAt: new Date() },
];

// ─── STOCKS ─────────────────────────────────────────────────
function makeStock(id: string, productId: string, branchId: string, qty: number, min: number) {
  return { id, productId, branchId, quantity: qty, minAlert: min };
}
const initialStocks = [
  // b1 ลาดพร้าว
  makeStock("st1",  "p1",  "b1", 8,  3), makeStock("st2",  "p2",  "b1", 15, 5),
  makeStock("st3",  "p3",  "b1", 2,  3), makeStock("st4",  "p4",  "b1", 5,  2),
  makeStock("st5",  "p5",  "b1", 3,  2), makeStock("st6",  "p6",  "b1", 6,  2),
  makeStock("st7",  "p7",  "b1", 4,  2), makeStock("st8",  "p8",  "b1", 20, 5),
  makeStock("st9",  "p9",  "b1", 18, 5), makeStock("st10", "p10", "b1", 30, 8),
  makeStock("st11", "p11", "b1", 20, 5), makeStock("st12", "p12", "b1", 8,  3),
  makeStock("st13", "p13", "b1", 15, 5), makeStock("st14", "p14", "b1", 6,  2),
  makeStock("st15", "p15", "b1", 10, 3), makeStock("st16", "p16", "b1", 40, 10),
  makeStock("st17", "p17", "b1", 25, 8), makeStock("st18", "p18", "b1", 20, 8),
  makeStock("st19", "p19", "b1", 12, 5), makeStock("st20", "p20", "b1", 8,  3),
  makeStock("st21", "p21", "b1", 6,  3), makeStock("st22", "p22", "b1", 5,  2),
  makeStock("st23", "p23", "b1", 60, 15),makeStock("st24", "p24", "b1", 30, 8),
  makeStock("st25", "p25", "b1", 50, 10),
  // b2 สยาม
  makeStock("st26", "p1",  "b2", 5,  3), makeStock("st27", "p2",  "b2", 10, 5),
  makeStock("st28", "p3",  "b2", 8,  3), makeStock("st29", "p4",  "b2", 3,  2),
  makeStock("st30", "p5",  "b2", 2,  2), makeStock("st31", "p10", "b2", 20, 5),
  makeStock("st32", "p13", "b2", 12, 5), makeStock("st33", "p17", "b2", 18, 8),
  makeStock("st34", "p21", "b2", 8,  3), makeStock("st35", "p23", "b2", 40, 10),
  // b3 พระราม9
  makeStock("st36", "p1",  "b3", 4,  3), makeStock("st37", "p2",  "b3", 8,  5),
  makeStock("st38", "p8",  "b3", 12, 5), makeStock("st39", "p10", "b3", 15, 5),
  makeStock("st40", "p17", "b3", 10, 5), makeStock("st41", "p23", "b3", 25, 8),
];

// ─── CUSTOMERS ──────────────────────────────────────────────
const initialCustomers = [
  { id: "c1",  name: "คุณวิภาวี รักษ์ดี",        phone: "081-234-5678", email: "wipavee@gmail.com",       lineId: "wipa_line",    gender: "หญิง", birthDate: new Date("1990-05-15"), loyaltyPoints: 4200,  loyaltyTier: "GOLD",     notes: "ลูกค้าประจำ ชอบแว่นกรอบบาง", branchId: "b1", createdAt: new Date("2023-06-10"), updatedAt: new Date() },
  { id: "c2",  name: "คุณเกรียงไกร ชนะภัย",      phone: "089-876-5432", email: "kriangkrai@outlook.com",  lineId: "kk_win",       gender: "ชาย",  birthDate: new Date("1982-11-20"), loyaltyPoints: 8500,  loyaltyTier: "PLATINUM", notes: "ซื้อแว่นทุกปี มีสายตาสูง", branchId: "b1", createdAt: new Date("2023-03-15"), updatedAt: new Date() },
  { id: "c3",  name: "Mr. John Smith",              phone: "090-111-2222", email: "john.smith@gmail.com",    lineId: "johnsmith_bkk",gender: "ชาย",  birthDate: new Date("1975-02-08"), loyaltyPoints: 480,   loyaltyTier: "SILVER",   notes: "ชาวต่างชาติ ต้องการภาษาอังกฤษ", branchId: "b2", createdAt: new Date("2024-01-20"), updatedAt: new Date() },
  { id: "c4",  name: "คุณนภัสสร พลเยี่ยม",        phone: "085-456-7890", email: "napat@gmail.com",          lineId: "napat_eye",    gender: "หญิง", birthDate: new Date("1995-08-22"), loyaltyPoints: 1250,  loyaltyTier: "GOLD",     notes: null, branchId: "b1", createdAt: new Date("2023-09-01"), updatedAt: new Date() },
  { id: "c5",  name: "คุณกมลชัย อำนวยสุข",        phone: "086-234-5678", email: "kamonchay@yahoo.com",      lineId: null,           gender: "ชาย",  birthDate: new Date("1968-03-11"), loyaltyPoints: 12000, loyaltyTier: "PLATINUM", notes: "VIP ลูกค้าประจำ 5 ปี", branchId: "b1", createdAt: new Date("2023-02-01"), updatedAt: new Date() },
  { id: "c6",  name: "คุณพิมพ์ชนก เมตตา",          phone: "088-321-0000", email: "pimchanok@hotmail.com",    lineId: "pim_glass",    gender: "หญิง", birthDate: new Date("1998-12-05"), loyaltyPoints: 320,   loyaltyTier: "SILVER",   notes: null, branchId: "b2", createdAt: new Date("2024-02-10"), updatedAt: new Date() },
  { id: "c7",  name: "คุณอานนท์ ศรีพลับ",          phone: "084-555-9999", email: null,                       lineId: "arnon_siam",   gender: "ชาย",  birthDate: new Date("1980-07-30"), loyaltyPoints: 650,   loyaltyTier: "SILVER",   notes: "แพ้เลนส์บางยี่ห้อ", branchId: "b2", createdAt: new Date("2023-11-15"), updatedAt: new Date() },
  { id: "c8",  name: "คุณสุรีรัตน์ ขยันดี",        phone: "082-777-3344", email: "suree@gmail.com",          lineId: null,           gender: "หญิง", birthDate: new Date("1973-01-18"), loyaltyPoints: 3800,  loyaltyTier: "GOLD",     notes: "สนใจ Progressive lens", branchId: "b3", createdAt: new Date("2024-06-15"), updatedAt: new Date() },
  { id: "c9",  name: "คุณวีรชัย บุตรดี",            phone: "091-888-4455", email: "weerachai@gmail.com",      lineId: "wee_eye",      gender: "ชาย",  birthDate: new Date("1992-04-25"), loyaltyPoints: 80,    loyaltyTier: "BRONZE",   notes: null, branchId: "b1", createdAt: new Date("2025-01-05"), updatedAt: new Date() },
  { id: "c10", name: "คุณมณีรัตน์ สว่างใจ",        phone: "093-456-7890", email: "manee@outlook.com",        lineId: "manee_bright", gender: "หญิง", birthDate: new Date("1985-09-14"), loyaltyPoints: 2100,  loyaltyTier: "GOLD",     notes: "ชอบแว่น Titanium น้ำหนักเบา", branchId: "b1", createdAt: new Date("2023-07-20"), updatedAt: new Date() },
  { id: "c11", name: "Ms. Sarah Johnson",            phone: "094-111-5566", email: "sarah.j@company.com",     lineId: null,           gender: "หญิง", birthDate: new Date("1988-06-02"), loyaltyPoints: 150,   loyaltyTier: "BRONZE",   notes: "Corporate customer", branchId: "b2", createdAt: new Date("2024-08-10"), updatedAt: new Date() },
  { id: "c12", name: "คุณบรรจง เนตรปัญญา",          phone: "087-654-3210", email: "banjong@gmail.com",        lineId: "banjong77",    gender: "ชาย",  birthDate: new Date("1965-02-28"), loyaltyPoints: 5600,  loyaltyTier: "PLATINUM", notes: "มีสายตาสูงมาก เลนส์ดัชนี 1.74", branchId: "b1", createdAt: new Date("2023-04-05"), updatedAt: new Date() },
  { id: "c13", name: "คุณปริญญา ชัยธิติ",            phone: "089-222-6677", email: "parinya@hotmail.com",      lineId: null,           gender: "ชาย",  birthDate: new Date("1978-11-03"), loyaltyPoints: 900,   loyaltyTier: "SILVER",   notes: null, branchId: "b3", createdAt: new Date("2024-07-01"), updatedAt: new Date() },
  { id: "c14", name: "คุณรัตนา กิตติโสภณ",          phone: "096-333-8899", email: "rattana@gmail.com",        lineId: "rattana_opt",  gender: "หญิง", birthDate: new Date("2000-03-15"), loyaltyPoints: 220,   loyaltyTier: "BRONZE",   notes: "นักศึกษา ต้องการราคาประหยัด", branchId: "b2", createdAt: new Date("2024-09-20"), updatedAt: new Date() },
  { id: "c15", name: "คุณชาญชัย มีโชค",              phone: "095-444-0011", email: "chanchai@gmail.com",       lineId: "cc_lucky",     gender: "ชาย",  birthDate: new Date("1970-07-07"), loyaltyPoints: 7200,  loyaltyTier: "PLATINUM", notes: "ซื้อแว่นหลายคู่ต่อปี ทั้งแว่นสายตาและแว่นกันแดด", branchId: "b1", createdAt: new Date("2023-01-25"), updatedAt: new Date() },
];

// ─── EYE PRESCRIPTIONS ──────────────────────────────────────
const initialEyePrescriptions = [
  { id: "ep1", customerId: "c1",  recordedAt: new Date("2026-02-10"), recorderId: "u3", sphR: -2.50, cylR: -0.75, axisR: 90,  pdR: 31.5, addR: 0,    sphL: -2.75, cylL: -0.50, axisL: 95,  pdL: 31.0, addL: 0,    notes: "ตาล้าจากหน้าจอ แนะนำ BlueControl" },
  { id: "ep2", customerId: "c2",  recordedAt: new Date("2026-05-01"), recorderId: "u3", sphR: +1.25, cylR: -1.25, axisR: 180, pdR: 33.0, addR: 1.75, sphL: +1.50, cylL: -1.00, axisL: 175, pdL: 33.5, addL: 1.75, notes: "Presbyopia แนะนำ Progressive" },
  { id: "ep3", customerId: "c4",  recordedAt: new Date("2026-01-15"), recorderId: "u6", sphR: -1.00, cylR: 0,     axisR: 0,   pdR: 30.0, addR: 0,    sphL: -1.25, cylL: 0,     axisL: 0,   pdL: 30.5, addL: 0,    notes: "สายตาเริ่มสั้น ครั้งแรก" },
  { id: "ep4", customerId: "c5",  recordedAt: new Date("2025-12-20"), recorderId: "u3", sphR: -5.50, cylR: -0.50, axisR: 170, pdR: 32.0, addR: 2.00, sphL: -5.75, cylL: -0.75, axisL: 165, pdL: 32.0, addL: 2.00, notes: "สายตาสูง ต้องใช้เลนส์ดัชนีสูง" },
  { id: "ep5", customerId: "c8",  recordedAt: new Date("2026-03-05"), recorderId: "u5", sphR: +2.00, cylR: -0.50, axisR: 90,  pdR: 33.0, addR: 1.50, sphL: +1.75, cylL: -0.25, axisL: 85,  pdL: 33.0, addL: 1.50, notes: "ต้องการ Progressive lens" },
  { id: "ep6", customerId: "c12", recordedAt: new Date("2026-04-10"), recorderId: "u3", sphR: -8.00, cylR: -1.00, axisR: 180, pdR: 31.0, addR: 2.25, sphL: -8.50, cylL: -0.75, axisL: 175, pdL: 31.5, addL: 2.25, notes: "สายตาสูงมาก แนะนำ 1.74 index" },
  { id: "ep7", customerId: "c10", recordedAt: new Date("2026-05-20"), recorderId: "u6", sphR: -3.00, cylR: -0.50, axisR: 90,  pdR: 31.5, addR: 0,    sphL: -3.25, cylL: -0.75, axisL: 95,  pdL: 31.5, addL: 0,    notes: "ชอบกรอบน้ำหนักเบา Titanium" },
];

// ─── SHIFTS ─────────────────────────────────────────────────
const d = () => new Date();
const hm = (h: number, m = 0) => { const t = new Date(); t.setHours(h, m, 0, 0); return t; };
const initialShifts = [
  { id: "sf1", userId: "u3", openedAt: hm(8),  closedAt: null,    startingCash: 3000, expectedCash: 3000,  actualCash: null,  difference: null, status: "OPEN",   notes: "กะเช้า" },
  { id: "sf2", userId: "u6", openedAt: hm(13), closedAt: null,    startingCash: 2000, expectedCash: 2000,  actualCash: null,  difference: null, status: "OPEN",   notes: "กะบ่าย" },
  { id: "sf3", userId: "u4", openedAt: hm(10), closedAt: hm(22),  startingCash: 3000, expectedCash: 21500, actualCash: 21500, difference: 0,    status: "CLOSED", notes: "กะเต็มวันสาขาสยาม" },
];

// ─── HELPERS to generate orders ──────────────────────────────
function daysAgo(n: number, h = 10, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d;
}

// ─── ORDERS ─────────────────────────────────────────────────
const initialOrders: any[] = [
  // TODAY — b1 (sf1)
  { id: "o1",  orderNumber: "INV-20260607-001", customerId: "c1",  sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 11000, discountAmount: 1000, netAmount: 10000, paidAmount: 10000, paymentMethod: "QR_PROMPTPAY",  status: "PAID",    isETaxRequested: true,  createdAt: daysAgo(0, 10, 30), updatedAt: daysAgo(0, 10, 32) },
  { id: "o2",  orderNumber: "INV-20260607-002", customerId: "c2",  sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 20500, discountAmount: 500,  netAmount: 20000, paidAmount: 10000, paymentMethod: "INSTALLMENT",    status: "PENDING", isETaxRequested: false, createdAt: daysAgo(0, 13, 15), updatedAt: daysAgo(0, 13, 15) },
  { id: "o3",  orderNumber: "INV-20260607-003", customerId: "c4",  sellerId: "u6", branchId: "b1", shiftId: "sf2", totalAmount: 3640,  discountAmount: 0,    netAmount: 3640,  paidAmount: 3640,  paymentMethod: "CASH",           status: "PAID",    isETaxRequested: false, createdAt: daysAgo(0, 14, 0),  updatedAt: daysAgo(0, 14, 5)  },
  { id: "o4",  orderNumber: "INV-20260607-004", customerId: null,  sellerId: "u6", branchId: "b1", shiftId: "sf2", totalAmount: 390,   discountAmount: 0,    netAmount: 390,   paidAmount: 390,   paymentMethod: "CASH",           status: "PAID",    isETaxRequested: false, createdAt: daysAgo(0, 15, 30), updatedAt: daysAgo(0, 15, 30) },
  // YESTERDAY — b1
  { id: "o5",  orderNumber: "INV-20260606-001", customerId: "c5",  sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 27300, discountAmount: 2300, netAmount: 25000, paidAmount: 25000, paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: true,  createdAt: daysAgo(1, 11, 0),  updatedAt: daysAgo(1, 11, 5)  },
  { id: "o6",  orderNumber: "INV-20260606-002", customerId: "c10", sellerId: "u6", branchId: "b1", shiftId: "sf1", totalAmount: 11000, discountAmount: 0,    netAmount: 11000, paidAmount: 11000, paymentMethod: "QR_PROMPTPAY",  status: "PAID",    isETaxRequested: false, createdAt: daysAgo(1, 14, 20), updatedAt: daysAgo(1, 14, 20) },
  { id: "o7",  orderNumber: "INV-20260606-003", customerId: "c9",  sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 1040,  discountAmount: 0,    netAmount: 1040,  paidAmount: 1040,  paymentMethod: "CASH",           status: "PAID",    isETaxRequested: false, createdAt: daysAgo(1, 16, 45), updatedAt: daysAgo(1, 16, 45) },
  // b2 สยาม
  { id: "o8",  orderNumber: "INV-20260607-005", customerId: "c3",  sellerId: "u4", branchId: "b2", shiftId: "sf3", totalAmount: 6350,  discountAmount: 350,  netAmount: 6000,  paidAmount: 6000,  paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: true,  createdAt: daysAgo(0, 12, 0),  updatedAt: daysAgo(0, 12, 10) },
  { id: "o9",  orderNumber: "INV-20260607-006", customerId: "c6",  sellerId: "u4", branchId: "b2", shiftId: "sf3", totalAmount: 2500,  discountAmount: 0,    netAmount: 2500,  paidAmount: 2500,  paymentMethod: "QR_PROMPTPAY",  status: "PAID",    isETaxRequested: false, createdAt: daysAgo(0, 15, 30), updatedAt: daysAgo(0, 15, 30) },
  { id: "o10", orderNumber: "INV-20260607-007", customerId: "c7",  sellerId: "u7", branchId: "b2", shiftId: "sf3", totalAmount: 15300, discountAmount: 300,  netAmount: 15000, paidAmount: 15000, paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: true,  createdAt: daysAgo(0, 17, 0),  updatedAt: daysAgo(0, 17, 10) },
  // Older orders for reports (1-30 days ago)
  { id: "o11", orderNumber: "INV-20260605-001", customerId: "c12", sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 20000, discountAmount: 0,    netAmount: 20000, paidAmount: 20000, paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: true,  createdAt: daysAgo(2, 10, 0),  updatedAt: daysAgo(2, 10, 5)  },
  { id: "o12", orderNumber: "INV-20260605-002", customerId: "c15", sellerId: "u6", branchId: "b1", shiftId: "sf1", totalAmount: 14000, discountAmount: 1000, netAmount: 13000, paidAmount: 13000, paymentMethod: "QR_PROMPTPAY",  status: "PAID",    isETaxRequested: false, createdAt: daysAgo(2, 14, 30), updatedAt: daysAgo(2, 14, 30) },
  { id: "o13", orderNumber: "INV-20260603-001", customerId: "c8",  sellerId: "u5", branchId: "b3", shiftId: "sf1", totalAmount: 22300, discountAmount: 300,  netAmount: 22000, paidAmount: 22000, paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: true,  createdAt: daysAgo(4, 11, 0),  updatedAt: daysAgo(4, 11, 0)  },
  { id: "o14", orderNumber: "INV-20260601-001", customerId: "c2",  sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 9800,  discountAmount: 0,    netAmount: 9800,  paidAmount: 9800,  paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: false, createdAt: daysAgo(6, 9, 30),  updatedAt: daysAgo(6, 9, 30)  },
  { id: "o15", orderNumber: "INV-20260530-001", customerId: "c5",  sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 7200,  discountAmount: 200,  netAmount: 7000,  paidAmount: 7000,  paymentMethod: "QR_PROMPTPAY",  status: "PAID",    isETaxRequested: false, createdAt: daysAgo(8, 13, 0),  updatedAt: daysAgo(8, 13, 0)  },
  { id: "o16", orderNumber: "INV-20260528-001", customerId: "c4",  sellerId: "u6", branchId: "b1", shiftId: "sf1", totalAmount: 2500,  discountAmount: 0,    netAmount: 2500,  paidAmount: 2500,  paymentMethod: "CASH",           status: "PAID",    isETaxRequested: false, createdAt: daysAgo(10, 10, 0), updatedAt: daysAgo(10, 10, 0) },
  { id: "o17", orderNumber: "INV-20260525-001", customerId: "c11", sellerId: "u4", branchId: "b2", shiftId: "sf3", totalAmount: 6100,  discountAmount: 0,    netAmount: 6100,  paidAmount: 6100,  paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: false, createdAt: daysAgo(13, 11, 0), updatedAt: daysAgo(13, 11, 0) },
  { id: "o18", orderNumber: "INV-20260520-001", customerId: "c13", sellerId: "u5", branchId: "b3", shiftId: "sf1", totalAmount: 4700,  discountAmount: 0,    netAmount: 4700,  paidAmount: 4700,  paymentMethod: "QR_PROMPTPAY",  status: "PAID",    isETaxRequested: false, createdAt: daysAgo(18, 14, 0), updatedAt: daysAgo(18, 14, 0) },
  { id: "o19", orderNumber: "INV-20260515-001", customerId: "c1",  sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 12500, discountAmount: 500,  netAmount: 12000, paidAmount: 12000, paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: true,  createdAt: daysAgo(23, 10, 0), updatedAt: daysAgo(23, 10, 0) },
  { id: "o20", orderNumber: "INV-20260510-001", customerId: "c15", sellerId: "u3", branchId: "b1", shiftId: "sf1", totalAmount: 16300, discountAmount: 300,  netAmount: 16000, paidAmount: 16000, paymentMethod: "CREDIT_CARD",    status: "PAID",    isETaxRequested: true,  createdAt: daysAgo(28, 11, 30), updatedAt: daysAgo(28, 11, 30) },
];

// ─── ORDER ITEMS ─────────────────────────────────────────────
const initialOrderItems = [
  // o1: Gucci + Hoya 1.56
  { id: "oi1",  orderId: "o1",  productId: "p1",  quantity: 1, price: 8500, discount: 500 },
  { id: "oi2",  orderId: "o1",  productId: "p10", quantity: 1, price: 2500, discount: 500 },
  // o2: Lindberg + Varilux Progressive
  { id: "oi3",  orderId: "o2",  productId: "p5",  quantity: 1, price: 14500, discount: 500 },
  { id: "oi4",  orderId: "o2",  productId: "p14", quantity: 1, price: 12500, discount: 0 },
  { id: "oi5",  orderId: "o2",  productId: "p23", quantity: 1, price: 150,  discount: 0 },
  // o3: Hoya 1.67 + EyeFocus Frame
  { id: "oi6",  orderId: "o3",  productId: "p11", quantity: 1, price: 4200, discount: 0 },
  { id: "oi7",  orderId: "o3",  productId: "p8",  quantity: 1, price: 1200, discount: 0 },
  { id: "oi8",  orderId: "o3",  productId: "p23", quantity: 1, price: 150,  discount: 0 },
  { id: "oi9",  orderId: "o3",  productId: "p25", quantity: 1, price: 120,  discount: 0 },
  // o4: Premium Hard Case
  { id: "oi10", orderId: "o4",  productId: "p24", quantity: 1, price: 390,  discount: 0 },
  // o5: Tom Ford + Essilor Transitions
  { id: "oi11", orderId: "o5",  productId: "p4",  quantity: 1, price: 9800, discount: 1300 },
  { id: "oi12", orderId: "o5",  productId: "p13", quantity: 1, price: 7800, discount: 1000 },
  // o6: Silhouette + Hoya 1.74
  { id: "oi13", orderId: "o6",  productId: "p7",  quantity: 1, price: 11000, discount: 0 },
  { id: "oi14", orderId: "o6",  productId: "p12", quantity: 1, price: 6800, discount: 0 },
  // o7: Acuvue Moist x2
  { id: "oi15", orderId: "o7",  productId: "p17", quantity: 2, price: 1250, discount: 0 },
  { id: "oi16", orderId: "o7",  productId: "p25", quantity: 1, price: 120,  discount: 0 },
  // o8: Persol + Essilor Crizal
  { id: "oi17", orderId: "o8",  productId: "p6",  quantity: 1, price: 7200, discount: 350 },
  { id: "oi18", orderId: "o8",  productId: "p13", quantity: 1, price: 7800, discount: 0 },
  // o9: Hoya 1.56
  { id: "oi19", orderId: "o9",  productId: "p10", quantity: 1, price: 2500, discount: 0 },
  // o10: Tom Ford + Varilux
  { id: "oi20", orderId: "o10", productId: "p4",  quantity: 1, price: 9800, discount: 300 },
  { id: "oi21", orderId: "o10", productId: "p14", quantity: 1, price: 12500, discount: 0 },
  // o11: Hoya 1.74 x2 pairs
  { id: "oi22", orderId: "o11", productId: "p1",  quantity: 1, price: 8500, discount: 0 },
  { id: "oi23", orderId: "o11", productId: "p12", quantity: 1, price: 6800, discount: 0 },
  // o12: Ray-Ban + Hoya iD
  { id: "oi24", orderId: "o12", productId: "p2",  quantity: 1, price: 5200, discount: 500 },
  { id: "oi25", orderId: "o12", productId: "p15", quantity: 1, price: 9800, discount: 500 },
  // o13: Varilux + Silhouette
  { id: "oi26", orderId: "o13", productId: "p7",  quantity: 1, price: 11000, discount: 0 },
  { id: "oi27", orderId: "o13", productId: "p14", quantity: 1, price: 12500, discount: 300 },
  // o14: Oakley sunglasses
  { id: "oi28", orderId: "o14", productId: "p22", quantity: 1, price: 6500, discount: 0 },
  { id: "oi29", orderId: "o14", productId: "p10", quantity: 1, price: 2500, discount: 0 },
  // o15: Persol sunglasses
  { id: "oi30", orderId: "o15", productId: "p6",  quantity: 1, price: 7200, discount: 200 },
  // o16: Hoya 1.56 contact lens
  { id: "oi31", orderId: "o16", productId: "p10", quantity: 1, price: 2500, discount: 0 },
  // o17: Ray-Ban Clubmaster
  { id: "oi32", orderId: "o17", productId: "p2",  quantity: 1, price: 5200, discount: 0 },
  { id: "oi33", orderId: "o17", productId: "p16", quantity: 1, price: 890,  discount: 0 },
  // o18: Hoya 1.67
  { id: "oi34", orderId: "o18", productId: "p11", quantity: 1, price: 4200, discount: 0 },
  { id: "oi35", orderId: "o18", productId: "p8",  quantity: 1, price: 1200, discount: 0 },
  // o19: Gucci + Hoya iD progressive
  { id: "oi36", orderId: "o19", productId: "p1",  quantity: 1, price: 8500, discount: 500 },
  { id: "oi37", orderId: "o19", productId: "p15", quantity: 1, price: 9800, discount: 0 },
  // o20: Lindberg + Varilux
  { id: "oi38", orderId: "o20", productId: "p5",  quantity: 1, price: 14500, discount: 300 },
  { id: "oi39", orderId: "o20", productId: "p13", quantity: 1, price: 7800, discount: 0 },
];

// ─── JOB TICKETS ────────────────────────────────────────────
const initialJobTickets = [
  { id: "j1", orderId: "o1",  status: "SEND_TO_LAB",  labName: "หอแว่นแล็บพาร์ทเนอร์",  labId: "lv1", lensType: "Single Vision BlueControl",    lensDetails: "Hoya Nulux 1.56 BC",         sphR: -2.50, cylR: -0.75, axisR: 90,  addR: 0,    sphL: -2.75, cylL: -0.50, axisL: 95,  addL: 0,    pd: 62.5, notes: "ฝนเลนส์เข้ากรอบ Gucci GG0025O ระมัดระวัง",         targetDate: daysAgo(-3), updatedAt: new Date() },
  { id: "j2", orderId: "o2",  status: "PREPARING",    labName: "เอสซีลอร์แล็บไทย",       labId: "lv2", lensType: "Progressive Transitions",       lensDetails: "Essilor Varilux 1.60",       sphR: +1.25, cylR: -1.25, axisR: 180, addR: 1.75, sphL: +1.50, cylL: -1.00, axisL: 175, addL: 1.75, pd: 66.5, notes: "Progressive ระนาบสายตาสูง",                        targetDate: daysAgo(-5), updatedAt: new Date() },
  { id: "j3", orderId: "o5",  status: "RECEIVED",     labName: "เอสซีลอร์แล็บไทย",       labId: "lv2", lensType: "Progressive Transitions",       lensDetails: "Essilor Crizal Transitions", sphR: -5.50, cylR: -0.50, axisR: 170, addR: 2.00, sphL: -5.75, cylL: -0.75, axisL: 165, addL: 2.00, pd: 64.0, notes: "เร่งด่วน ลูกค้า VIP",                                targetDate: daysAgo(-2), updatedAt: daysAgo(-2) },
  { id: "j4", orderId: "o11", status: "READY",        labName: "โฮย่าแล็บ (ไทยแลนด์)",   labId: "lv3", lensType: "Single Vision 1.74 HiVision",   lensDetails: "Hoya Phoenix 1.74 WR",       sphR: -8.00, cylR: -1.00, axisR: 180, addR: 2.25, sphL: -8.50, cylL: -0.75, axisL: 175, addL: 2.25, pd: 62.5, notes: "สายตาสูงมาก ใช้เลนส์ดัชนี 1.74",                   targetDate: daysAgo(0), updatedAt: new Date() },
  { id: "j5", orderId: "o13", status: "DELIVERED",    labName: "โฮย่าแล็บ (ไทยแลนด์)",   labId: "lv3", lensType: "Progressive Varilux",           lensDetails: "Essilor Varilux Physio 3.0", sphR: +2.00, cylR: -0.50, axisR: 90,  addR: 1.50, sphL: +1.75, cylL: -0.25, axisL: 85,  addL: 1.50, pd: 66.0, notes: "ลูกค้ารับแว่นแล้ว เรียบร้อย",                       targetDate: daysAgo(2),  updatedAt: daysAgo(1) },
  { id: "j6", orderId: "o19", status: "SEND_TO_LAB",  labName: "หอแว่นแล็บพาร์ทเนอร์",  labId: "lv1", lensType: "Progressive iD MyStyle",         lensDetails: "Hoya iD MyStyle V+ 1.60",    sphR: -3.00, cylR: -0.50, axisR: 90,  addR: 0,    sphL: -3.25, cylL: -0.75, axisL: 95,  addL: 0,    pd: 63.0, notes: "กรอบ Gucci ระวังฝน",                                targetDate: daysAgo(-4), updatedAt: new Date() },
];

// ─── INSTALLMENTS ───────────────────────────────────────────
const initialInstallments = [
  { id: "in1", orderId: "o2", termNumber: 1, amount: 10000, dueDate: daysAgo(0),   paidDate: daysAgo(0), status: "PAID" },
  { id: "in2", orderId: "o2", termNumber: 2, amount: 5000,  dueDate: daysAgo(-30), paidDate: null,       status: "PENDING" },
  { id: "in3", orderId: "o2", termNumber: 3, amount: 5000,  dueDate: daysAgo(-60), paidDate: null,       status: "PENDING" },
];

// ─── APPOINTMENTS ───────────────────────────────────────────
const initialAppointments = [
  { id: "ap1", appointmentNumber: "APT-20260607-001", customerId: "c1",  sellerId: "u3", branchId: "b1", scheduledAt: hm(15, 0),        purpose: "วัดสายตาประกอบแว่นใหม่",     totalAmount: 1500, depositAmount: 500, status: "SCHEDULED", lineSent: true,  notes: "ลูกค้านัดช่วงบ่าย", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: "ap2", appointmentNumber: "APT-20260607-002", customerId: "c3",  sellerId: "u3", branchId: "b1", scheduledAt: daysAgo(-1, 11, 0), purpose: "รับแว่นสั่งตัด (Job j1)",   totalAmount: 0,    depositAmount: 0,   status: "SCHEDULED", lineSent: false, notes: "โทรแจ้งเมื่อแล็บส่งของมา", createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: "ap3", appointmentNumber: "APT-20260605-001", customerId: "c8",  sellerId: "u5", branchId: "b3", scheduledAt: daysAgo(2, 14, 0),  purpose: "วัดสายตาครั้งแรก สาขาพระราม9", totalAmount: 0,  depositAmount: 0,   status: "COMPLETED", lineSent: true,  notes: "ลูกค้าพอใจ", createdAt: daysAgo(3), updatedAt: daysAgo(2) },
  { id: "ap4", appointmentNumber: "APT-20260607-003", customerId: "c12", sellerId: "u3", branchId: "b1", scheduledAt: daysAgo(-2, 10, 0), purpose: "รับแว่นสายตาสูง 1.74",       totalAmount: 0,    depositAmount: 0,   status: "SCHEDULED", lineSent: false, notes: "แจ้งเมื่อ Job j4 ready", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: "ap5", appointmentNumber: "APT-20260607-004", customerId: "c5",  sellerId: "u3", branchId: "b1", scheduledAt: daysAgo(-3, 16, 0), purpose: "ปรับระดับแว่น Progressive", totalAmount: 0,    depositAmount: 0,   status: "SCHEDULED", lineSent: true,  notes: "VIP ลูกค้า ต้องการปรับ fitting", createdAt: daysAgo(0), updatedAt: daysAgo(0) },
];

// ─── CLAIMS ─────────────────────────────────────────────────
const initialClaims = [
  { id: "clm1", orderId: "o1",  branchId: "b1", customerId: "c1",  reason: "ขาแว่นหลวมและน็อตมีรอยบิ่นเมื่อรับของ",               status: "PENDING",   resolution: null,                       createdAt: daysAgo(0), updatedAt: daysAgo(0) },
  { id: "clm2", orderId: "o5",  branchId: "b1", customerId: "c5",  reason: "เลนส์มีรอยขีดข่วนหลังใช้งาน 2 สัปดาห์",              status: "IN_REVIEW", resolution: "ส่งเลนส์เข้าแล็บตรวจสอบ",  createdAt: daysAgo(3), updatedAt: daysAgo(1) },
  { id: "clm3", orderId: "o13", branchId: "b3", customerId: "c8",  reason: "สายตาไม่ตรงตามใบสั่ง รู้สึกมึนหัวหลังใส่",             status: "RESOLVED",  resolution: "วัดสายตาใหม่ พบค่าเปลี่ยน เปลี่ยนเลนส์ให้ฟรี", createdAt: daysAgo(5), updatedAt: daysAgo(2) },
  { id: "clm4", orderId: "o8",  branchId: "b2", customerId: "c3",  reason: "กรอบแว่นไม่ได้รูปทรงตามที่สั่ง ต่างจากตัวอย่าง",      status: "PENDING",   resolution: null,                       createdAt: daysAgo(1), updatedAt: daysAgo(1) },
];

// ─── STOCK TRANSFERS ─────────────────────────────────────────
const initialStockTransfers = [
  { id: "tx1", fromBranchId: "b2", toBranchId: "b1", productId: "p1", quantity: 1, senderId: "u4", receiverId: null,  status: "PENDING",  notes: "โอนกรอบ Gucci สำหรับออเดอร์หน้าร้านลาดพร้าว",  createdAt: daysAgo(0), updatedAt: daysAgo(0) },
  { id: "tx2", fromBranchId: "b1", toBranchId: "b3", productId: "p10", quantity: 5, senderId: "u2", receiverId: "u5", status: "RECEIVED", notes: "เติมเลนส์ 1.56 สาขาพระราม9 ใหม่",               createdAt: daysAgo(5), updatedAt: daysAgo(4) },
  { id: "tx3", fromBranchId: "b1", toBranchId: "b2", productId: "p17", quantity: 10, senderId: "u2", receiverId: "u4", status: "RECEIVED", notes: "เติม Acuvue Moist สาขาสยาม",                    createdAt: daysAgo(8), updatedAt: daysAgo(7) },
];

// ─── SUPPLIERS ───────────────────────────────────────────────
const initialSuppliers = [
  { id: "sup1", name: "บริษัท ไทยออปติค จำกัด",        contact: "คุณสมชาย วิชาดี",   phone: "02-555-1111", email: "order@thaioptik.com",    address: "ลาดกระบัง กรุงเทพฯ", categories: ["FRAME", "SUNGLASSES"], paymentTerms: "30 วัน", createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "sup2", name: "บริษัท เอสซีลอร์ (ประเทศไทย)",  contact: "คุณนภัทร สว่าง",   phone: "02-888-2222", email: "sales@essilor.co.th",    address: "สาทร กรุงเทพฯ",       categories: ["LENS"],                paymentTerms: "30 วัน", createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "sup3", name: "บริษัท โฮย่า เลนส์ (ไทยแลนด์)", contact: "คุณพิชัย เลนส์ดี",  phone: "02-777-3333", email: "info@hoya.co.th",        address: "รัชดาภิเษก กรุงเทพฯ", categories: ["LENS"],                paymentTerms: "45 วัน", createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "sup4", name: "บริษัท จอห์นสัน แอนด์ จอห์นสัน", contact: "คุณสิริพร คอนแทค", phone: "02-444-4444", email: "acuvue@jnj.th",          address: "สีลม กรุงเทพฯ",        categories: ["CONTACT_LENS"],        paymentTerms: "30 วัน", createdAt: new Date("2023-06-01"), updatedAt: new Date() },
  { id: "sup5", name: "บริษัท EyeFocus Supply Co.",     contact: "คุณรัตนา โอเอ็ม",   phone: "02-222-5555", email: "supply@eyefocus.co.th",  address: "สำนักงานใหญ่ กรุงเทพฯ", categories: ["ACCESSORY", "FRAME"],  paymentTerms: "60 วัน", createdAt: new Date("2023-01-01"), updatedAt: new Date() },
];

// ─── LAB VENDORS ─────────────────────────────────────────────
const initialLabVendors = [
  { id: "lv1", name: "หอแว่นแล็บพาร์ทเนอร์",   contact: "คุณสมหมาย แล็บดี", phone: "02-111-9999", email: "lab@hawwan.co.th",       address: "รามคำแหง กรุงเทพฯ",   turnaroundDays: 3, specialties: ["Single Vision", "UV Coat"], isActive: true, createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "lv2", name: "เอสซีลอร์แล็บไทย",        contact: "คุณรวิพร แสงทอง",  phone: "02-333-8888", email: "lab.th@essilor.com",      address: "สุขุมวิท กรุงเทพฯ",    turnaroundDays: 5, specialties: ["Progressive", "Transitions", "Crizal"], isActive: true, createdAt: new Date("2023-01-01"), updatedAt: new Date() },
  { id: "lv3", name: "โฮย่าแล็บ (ไทยแลนด์)",    contact: "คุณวิชา โฮย่า",    phone: "02-666-7777", email: "thlab@hoya.com",          address: "บางนา กรุงเทพฯ",       turnaroundDays: 4, specialties: ["High Index 1.74", "iD Progressive", "BlueControl"], isActive: true, createdAt: new Date("2023-06-01"), updatedAt: new Date() },
  { id: "lv4", name: "พรีเมี่ยม ออปติคอล แล็บ", contact: "คุณมนัส พรีเมี่ยม", phone: "02-999-1234", email: "info@premiumoptlab.co.th", address: "พระราม 3 กรุงเทพฯ",    turnaroundDays: 7, specialties: ["Luxury Frame Fitting", "Custom Progressive"], isActive: true, createdAt: new Date("2024-01-01"), updatedAt: new Date() },
];

// ─── COMMISSION RULES ─────────────────────────────────────────
const initialCommissionRules = [
  { id: "cr1", userId: "u3", userName: "คุณสมพร หน้าร้าน",      ratePercent: 3.0,  targetMonthly: 150000, notes: "Seller Standard Rate" },
  { id: "cr2", userId: "u4", userName: "คุณสมบัติ สยามพารากอน", ratePercent: 3.0,  targetMonthly: 150000, notes: "Seller Standard Rate" },
  { id: "cr3", userId: "u6", userName: "คุณนารี ดีใจ",          ratePercent: 3.0,  targetMonthly: 120000, notes: "Seller Standard Rate" },
  { id: "cr4", userId: "u7", userName: "คุณวิทยา เรียนไว",      ratePercent: 3.0,  targetMonthly: 120000, notes: "Seller Standard Rate" },
  { id: "cr5", userId: "u2", userName: "คุณสมศรี สุขใจ",        ratePercent: 1.5,  targetMonthly: 500000, notes: "Manager Override Rate" },
  { id: "cr6", userId: "u5", userName: "คุณสมหวัง พระราม9",     ratePercent: 1.5,  targetMonthly: 300000, notes: "Manager Override Rate" },
];

// ─── AUDIT LOGS ───────────────────────────────────────────────
const initialAuditLogs = [
  { id: "al1",  userId: "u1", userName: "คุณสมชาย ใจดี",    action: "SYSTEM_LOGIN",       target: "system",  detail: "เข้าสู่ระบบ Owner dashboard",           createdAt: daysAgo(0, 8, 0)  },
  { id: "al2",  userId: "u3", userName: "คุณสมพร หน้าร้าน", action: "SHIFT_OPEN",         target: "sf1",     detail: "เปิดกะ เงินเริ่มต้น 3,000 บาท",         createdAt: daysAgo(0, 8, 5)  },
  { id: "al3",  userId: "u3", userName: "คุณสมพร หน้าร้าน", action: "ORDER_CREATED",      target: "o1",      detail: "สร้างออเดอร์ INV-20260607-001 / 10,000฿", createdAt: daysAgo(0, 10, 30)},
  { id: "al4",  userId: "u3", userName: "คุณสมพร หน้าร้าน", action: "ORDER_CREATED",      target: "o2",      detail: "สร้างออเดอร์ INV-20260607-002 / ผ่อน 3 งวด",createdAt: daysAgo(0, 13, 15)},
  { id: "al5",  userId: "u2", userName: "คุณสมศรี สุขใจ",   action: "PRODUCT_UPDATED",    target: "p1",      detail: "อัปเดตราคาขาย Gucci GG0025O 8,200 → 8,500฿",createdAt: daysAgo(2, 9, 0)  },
  { id: "al6",  userId: "u2", userName: "คุณสมศรี สุขใจ",   action: "STOCK_TRANSFER",     target: "tx2",     detail: "โอนสต็อก Hoya 1.56 × 5 → สาขาพระราม9",    createdAt: daysAgo(5, 10, 0) },
  { id: "al7",  userId: "u1", userName: "คุณสมชาย ใจดี",    action: "USER_CREATED",       target: "u7",      detail: "สร้างบัญชีพนักงานใหม่: คุณวิทยา เรียนไว",   createdAt: daysAgo(10, 9, 0) },
  { id: "al8",  userId: "u1", userName: "คุณสมชาย ใจดี",    action: "BRANCH_CREATED",     target: "b3",      detail: "เปิดสาขาพระราม9 รหัส R01",                  createdAt: new Date("2024-06-01") },
  { id: "al9",  userId: "u3", userName: "คุณสมพร หน้าร้าน", action: "APPOINTMENT_CREATED",target: "ap1",     detail: "นัดหมายลูกค้า คุณวิภาวี 15:00",             createdAt: daysAgo(1, 14, 0) },
  { id: "al10", userId: "u4", userName: "คุณสมบัติ สยาม",   action: "ORDER_CREATED",      target: "o8",      detail: "สร้างออเดอร์ INV-20260607-005 / 6,000฿",    createdAt: daysAgo(0, 12, 0) },
];

// ─── GLOBAL PERSISTENT STATE ─────────────────────────────────
declare global {
  var mockDb: MockDb | undefined;
}

if (!global.mockDb) {
  global.mockDb = {
    branches:        initialBranches,
    users:           initialUsers,
    shifts:          initialShifts,
    customers:       initialCustomers,
    eyePrescriptions:initialEyePrescriptions,
    products:        initialProducts,
    stocks:          initialStocks,
    orders:          initialOrders,
    orderItems:      initialOrderItems,
    appointments:    initialAppointments,
    appointmentItems:[],
    jobTickets:      initialJobTickets,
    installments:    initialInstallments,
    claims:          initialClaims,
    stockTransfers:  initialStockTransfers,
    suppliers:       initialSuppliers,
    labVendors:      initialLabVendors,
    commissionRules: initialCommissionRules,
    auditLogs:       initialAuditLogs,
  };
}

export const db = global.mockDb!;

// ═══════════════════════════════════════════════════════════
// CRUD HELPERS
// ═══════════════════════════════════════════════════════════
export const dbHelper = {
  getCurrentUser: () => db.users[2],

  // ── Shifts ──
  getActiveShift: (userId: string) => db.shifts.find(s => s.userId === userId && s.status === "OPEN"),

  openShift: (userId: string, startingCash: number, notes?: string) => {
    db.shifts.forEach(s => {
      if (s.userId === userId && s.status === "OPEN") {
        s.status = "CLOSED"; s.closedAt = new Date();
      }
    });
    const newShift = { id: "sf_" + Date.now(), userId, openedAt: new Date(), closedAt: null, startingCash, expectedCash: startingCash, actualCash: null, difference: null, status: "OPEN", notes };
    db.shifts.push(newShift);
    return newShift;
  },

  closeShift: (shiftId: string, actualCash: number, notes?: string) => {
    const shift = db.shifts.find(s => s.id === shiftId);
    if (shift) {
      shift.closedAt = new Date(); shift.actualCash = actualCash;
      const cashSalesTotal = db.orders.filter(o => o.shiftId === shiftId && o.paymentMethod === "CASH" && o.status === "PAID").reduce((sum: number, o: any) => sum + o.paidAmount, 0);
      shift.expectedCash = shift.startingCash + cashSalesTotal;
      shift.difference = actualCash - shift.expectedCash;
      shift.status = "CLOSED"; shift.notes = notes || shift.notes;
      return shift;
    }
    return null;
  },

  // ── Products & Stock ──
  getProductsWithStock: (branchId: string) => {
    return db.products.map(p => {
      const stock = db.stocks.find((st: any) => st.productId === p.id && st.branchId === branchId);
      return { ...p, quantity: stock ? stock.quantity : 0, minAlert: stock ? stock.minAlert : 5 };
    });
  },

  updateStock: (productId: string, branchId: string, quantityChange: number) => {
    const stock = db.stocks.find((st: any) => st.productId === productId && st.branchId === branchId);
    if (stock) { stock.quantity = Math.max(0, stock.quantity + quantityChange); return stock; }
    else {
      const newStock = { id: "st_" + Date.now(), productId, branchId, quantity: Math.max(0, quantityChange), minAlert: 5 };
      db.stocks.push(newStock); return newStock;
    }
  },

  // ── Customers ──
  addCustomer: (data: { name: string; phone: string; email?: string; lineId?: string; gender?: string; birthDate?: string; notes?: string }) => {
    const newCustomer = { id: "c_" + Date.now(), ...data, email: data.email || null, lineId: data.lineId || null, gender: data.gender || null, birthDate: data.birthDate ? new Date(data.birthDate) : null, notes: data.notes || null, loyaltyPoints: 0, loyaltyTier: "BRONZE", createdAt: new Date(), updatedAt: new Date() };
    db.customers.unshift(newCustomer); return newCustomer;
  },

  // ── Eye Prescription ──
  addEyePrescription: (customerId: string, recorderId: string, data: any) => {
    const newPrescription = { id: "ep_" + Date.now(), customerId, recorderId, recordedAt: new Date(), sphR: parseFloat(data.sphR), cylR: data.cylR ? parseFloat(data.cylR) : null, axisR: data.axisR ? parseInt(data.axisR) : null, pdR: parseFloat(data.pdR), addR: data.addR ? parseFloat(data.addR) : null, sphL: parseFloat(data.sphL), cylL: data.cylL ? parseFloat(data.cylL) : null, axisL: data.axisL ? parseInt(data.axisL) : null, pdL: parseFloat(data.pdL), addL: data.addL ? parseFloat(data.addL) : null, notes: data.notes || null };
    db.eyePrescriptions.unshift(newPrescription); return newPrescription;
  },

  // ── Orders ──
  createOrder: (orderData: { customerId: string | null; sellerId: string; branchId: string; shiftId: string; totalAmount: number; discountAmount: number; netAmount: number; paidAmount: number; paymentMethod: string; items: { productId: string; quantity: number; price: number; discount: number }[]; isETaxRequested: boolean; lensDetails?: any }) => {
    const orderId = "o_" + Date.now();
    const orderNumber = "INV-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(db.orders.length + 1).padStart(3, "0");
    const newOrder = { id: orderId, orderNumber, ...orderData, status: orderData.paidAmount >= orderData.netAmount ? "PAID" : "PENDING", createdAt: new Date(), updatedAt: new Date() };
    db.orders.unshift(newOrder);
    orderData.items.forEach(item => {
      db.orderItems.push({ id: "oi_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5), orderId, ...item });
      dbHelper.updateStock(item.productId, orderData.branchId, -item.quantity);
    });
    if (orderData.customerId) {
      const customer = db.customers.find((c: any) => c.id === orderData.customerId);
      if (customer) {
        const pointsEarned = Math.floor(orderData.netAmount / 10);
        customer.loyaltyPoints += pointsEarned;
        if (customer.loyaltyPoints >= 5000) customer.loyaltyTier = "PLATINUM";
        else if (customer.loyaltyPoints >= 1000) customer.loyaltyTier = "GOLD";
        else if (customer.loyaltyPoints >= 300) customer.loyaltyTier = "SILVER";
      }
    }
    if (orderData.lensDetails) {
      db.jobTickets.push({ id: "j_" + Date.now(), orderId, status: "PENDING", labName: orderData.lensDetails.labName || "", labId: orderData.lensDetails.labId || null, lensType: orderData.lensDetails.lensType || "", lensDetails: orderData.lensDetails.lensDetails || "", sphR: orderData.lensDetails.sphR, cylR: orderData.lensDetails.cylR || null, axisR: orderData.lensDetails.axisR || null, addR: orderData.lensDetails.addR || null, sphL: orderData.lensDetails.sphL, cylL: orderData.lensDetails.cylL || null, axisL: orderData.lensDetails.axisL || null, addL: orderData.lensDetails.addL || null, pd: orderData.lensDetails.pd, notes: "สั่งเลนส์สำหรับออเดอร์ใหม่", targetDate: orderData.lensDetails.targetDate ? new Date(orderData.lensDetails.targetDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), updatedAt: new Date() });
    }
    if (orderData.paymentMethod === "INSTALLMENT") {
      const termAmount = orderData.netAmount / 3;
      ["_1","_2","_3"].forEach((s, i) => db.installments.push({ id: "inst_" + Date.now() + s, orderId, termNumber: i + 1, amount: termAmount, dueDate: new Date(new Date().setMonth(new Date().getMonth() + i)), paidDate: i === 0 ? new Date() : null, status: i === 0 ? "PAID" : "PENDING" }));
    }
    return newOrder;
  },

  // ── Appointments ──
  addAppointment: (data: { customerId: string; sellerId: string; branchId: string; scheduledAt: string; purpose: string; totalAmount?: number; depositAmount?: number; notes?: string }) => {
    const apptId = "ap_" + Date.now();
    const apptNumber = "APT-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(db.appointments.length + 1).padStart(3, "0");
    const newAppt = { id: apptId, appointmentNumber: apptNumber, ...data, scheduledAt: new Date(data.scheduledAt), totalAmount: data.totalAmount || 0, depositAmount: data.depositAmount || 0, status: "SCHEDULED", lineSent: false, notes: data.notes || null, createdAt: new Date(), updatedAt: new Date(), items: [] };
    db.appointments.unshift(newAppt); return newAppt;
  },

  // ── Job Tickets ──
  updateJobStatus: (jobId: string, newStatus: string) => {
    const job = db.jobTickets.find((j: any) => j.id === jobId);
    if (job) { job.status = newStatus; job.updatedAt = new Date(); return job; }
    return null;
  },

  // ── Stock Transfer ──
  createStockTransfer: (fromBranchId: string, toBranchId: string, productId: string, quantity: number, senderId: string, notes?: string) => {
    const newTx = { id: "tx_" + Date.now(), fromBranchId, toBranchId, productId, quantity, senderId, receiverId: null, status: "PENDING", notes: notes || null, createdAt: new Date(), updatedAt: new Date() };
    db.stockTransfers.unshift(newTx); return newTx;
  },

  receiveStockTransfer: (transferId: string, receiverId: string) => {
    const tx = db.stockTransfers.find((t: any) => t.id === transferId);
    if (tx && tx.status === "PENDING") {
      tx.status = "RECEIVED"; tx.receiverId = receiverId; tx.updatedAt = new Date();
      if (tx.productId && tx.quantity) dbHelper.updateStock(tx.productId, tx.toBranchId, tx.quantity);
      return tx;
    }
    return null;
  },

  // ── Audit Log ──
  addAuditLog: (userId: string, action: string, target: string, detail: string) => {
    const user = db.users.find((u: any) => u.id === userId);
    const log = { id: "al_" + Date.now(), userId, userName: user?.name || "Unknown", action, target, detail, createdAt: new Date() };
    db.auditLogs.unshift(log); return log;
  },
};
