// scripts/migrate-multi-roles.mjs — v4: WebSocket mode (full pg-compatible)
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Use direct (non-pooler) URL for DDL statements
const url = process.env.DATABASE_URL.replace("-pooler", "");
const pool = new Pool({ connectionString: url, max: 1 });

async function run() {
  const client = await pool.connect();
  console.log("🔗 Connected via WebSocket (direct)\n");

  const steps = [
    ["Add OD enum",       `ALTER TYPE role ADD VALUE IF NOT EXISTS 'OD'`],
    ["Add OPTICIAN enum", `ALTER TYPE role ADD VALUE IF NOT EXISTS 'OPTICIAN'`],
    ["Add SALES enum",    `ALTER TYPE role ADD VALUE IF NOT EXISTS 'SALES'`],
    ["Add CASHIER enum",  `ALTER TYPE role ADD VALUE IF NOT EXISTS 'CASHIER'`],
    ["Add roles[] column",`ALTER TABLE users ADD COLUMN IF NOT EXISTS roles text[]`],
    ["Set column default",`ALTER TABLE users ALTER COLUMN roles SET DEFAULT ARRAY['SALES']::text[]`],
    ["Populate roles[]",  `
      UPDATE users
      SET roles = CASE
        WHEN role::text = 'SELLER'   THEN ARRAY['SALES']::text[]
        WHEN role::text = 'OWNER'    THEN ARRAY['OWNER']::text[]
        WHEN role::text = 'MANAGER'  THEN ARRAY['MANAGER']::text[]
        WHEN role::text = 'OD'       THEN ARRAY['OD']::text[]
        WHEN role::text = 'OPTICIAN' THEN ARRAY['OPTICIAN']::text[]
        WHEN role::text = 'CASHIER'  THEN ARRAY['CASHIER']::text[]
        WHEN role::text = 'SALES'    THEN ARRAY['SALES']::text[]
        ELSE ARRAY[role::text]::text[]
      END
      WHERE roles IS NULL
    `],
    ["Migrate SELLER->SALES", `UPDATE users SET role = 'SALES' WHERE role = 'SELLER'`],
  ];

  let ok = 0;
  for (const [name, stmt] of steps) {
    try {
      const r = await client.query(stmt);
      console.log(`✅ ${name}${r.rowCount != null ? ` (${r.rowCount} rows)` : ""}`);
      ok++;
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log(`⏭️  ${name} (already done)`);
        ok++;
      } else {
        console.error(`❌ ${name}: ${e.message}`);
      }
    }
  }

  // Verify
  console.log("\n📊 Verification:");
  const { rows: cols } = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name IN ('role','roles')
    ORDER BY column_name
  `);
  cols.forEach(c => console.log(`  ✓ ${c.column_name}: ${c.data_type} (default: ${c.column_default ?? "none"})`));

  const { rows: dist } = await client.query(`
    SELECT role::text, roles, COUNT(*)::int AS cnt
    FROM users GROUP BY role, roles ORDER BY cnt DESC LIMIT 10
  `);
  console.log("  User distribution:");
  dist.forEach(d => console.log(`    ${d.role}: roles=${JSON.stringify(d.roles)} (${d.cnt} users)`));

  client.release();
  await pool.end();
  console.log(`\n✨ Done! ${ok}/${steps.length} steps OK`);
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
