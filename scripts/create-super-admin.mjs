// scripts/create-super-admin.mjs — Create a SUPER_ADMIN user for platform management
// Usage: node --env-file=.env.local scripts/create-super-admin.mjs
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const directUrl = (process.env.DATABASE_URL || "").replace("-pooler.", ".");
const sql = neon(directUrl);

async function main() {
  const email    = process.env.SUPER_ADMIN_EMAIL    || "admin@eyefocus.app";
  const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2025!";
  const name     = process.env.SUPER_ADMIN_NAME     || "EyeFocus Super Admin";

  console.log("🚀 Creating SUPER_ADMIN user...");
  console.log(`   Email: ${email}`);

  // Check if already exists
  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length) {
    console.log("⚠️  User already exists. Updating role to SUPER_ADMIN...");
    await sql`UPDATE users SET role = 'SUPER_ADMIN' WHERE email = ${email}`;
    console.log("✅ Done — role updated.");
    return;
  }

  // Need a system tenant for SUPER_ADMIN
  let tenantId;
  const sysTenant = await sql`SELECT id FROM tenants WHERE slug = 'system' LIMIT 1`;
  if (sysTenant.length) {
    tenantId = sysTenant[0].id;
  } else {
    const [t] = await sql`
      INSERT INTO tenants (name, slug, plan_type, max_branches, max_users, is_active)
      VALUES ('EyeFocus Platform', 'system', 'enterprise', 999, 999, true)
      RETURNING id
    `;
    tenantId = t.id;
    console.log("  ✅ Created system tenant");
  }

  const hash = await bcrypt.hash(password, 12);

  const [user] = await sql`
    INSERT INTO users (tenant_id, name, email, password_hash, role, is_active)
    VALUES (${tenantId}, ${name}, ${email}, ${hash}, 'SUPER_ADMIN', true)
    RETURNING id, email, role
  `;

  console.log(`\n✅ SUPER_ADMIN created!`);
  console.log(`   ID:    ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${user.role}`);
  console.log(`\n🔑 Login at: https://eyeforcusv2.krittatuch.workers.dev/login`);
  console.log(`   (จะ redirect ไป /admin/dashboard อัตโนมัติ)`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
