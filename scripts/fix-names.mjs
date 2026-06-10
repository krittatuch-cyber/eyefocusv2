// fix-names.mjs — Fix Thai user names (encoding was broken by PowerShell pipe)
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const USERS = [
  { email: "owner@eyefocus.com",    name: "สมชาย ใจดี" },
  { email: "manager@eyefocus.com",  name: "วิภา รักดี" },
  { email: "od@eyefocus.com",       name: "ดร.ดวงตา คมชัด" },
  { email: "optician@eyefocus.com", name: "ช่างแว่น สมใจ" },
  { email: "sales@eyefocus.com",    name: "สุดา ยิ้มดี" },
  { email: "cashier@eyefocus.com",  name: "มาลี ใสใจ" },
];

for (const u of USERS) {
  await sql`UPDATE users SET name = ${u.name}, updated_at = NOW() WHERE email = ${u.email}`;
  console.log("✓ Fixed:", u.email, "→", u.name);
}

console.log("\n✅ All names fixed!");
