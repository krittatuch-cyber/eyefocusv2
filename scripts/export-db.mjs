// scripts/export-db.mjs
// Export database schema (DDL) + data (INSERT statements) to db/backup/
// Usage: node scripts/export-db.mjs

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../.env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// sql.query() supports conventional function call with dynamic strings
const rawQuery = (query) => sql.query(query);

// Output directory
const outDir = path.join(__dirname, "../db/backup");
fs.mkdirSync(outDir, { recursive: true });

// ── Helpers ────────────────────────────────────────────────────────────────
function escapeValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInserts(tableName, rows) {
  if (!rows || rows.length === 0) return `-- ${tableName}: empty\n\n`;
  const cols = Object.keys(rows[0]);
  const lines = rows.map((row) => {
    const vals = cols.map((c) => escapeValue(row[c])).join(", ");
    return `  (${vals})`;
  });
  return (
    `INSERT INTO "${tableName}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES\n` +
    lines.join(",\n") +
    `\nON CONFLICT DO NOTHING;\n\n`
  );
}

// ── Export ─────────────────────────────────────────────────────────────────
async function exportDB() {
  console.log("🔌 Connecting to Neon PostgreSQL...");

  // 1. Get all tables
  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  const tableNames = tables.map((t) => t.tablename);
  console.log(`📋 Found ${tableNames.length} tables: ${tableNames.join(", ")}\n`);

  // ── 2. Schema DDL ──────────────────────────────────────────────────────
  console.log("📐 Exporting schema DDL...");
  let schemaSql = `-- EyeFocus V2 — Database Schema DDL\n-- Generated: ${new Date().toISOString()}\n-- ⚠️  Auto-generated — do not edit manually\n\n`;

  for (const table of tableNames) {
    const cols = await rawQuery(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${table}' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    const colDefs = cols.map((c) => {
      let type = c.data_type.toUpperCase();
      if (c.character_maximum_length) type += `(${c.character_maximum_length})`;
      let def = `  "${c.column_name}" ${type}`;
      if (c.column_default) def += ` DEFAULT ${c.column_default}`;
      if (c.is_nullable === "NO") def += " NOT NULL";
      return def;
    });

    schemaSql += `-- Table: ${table}\nCREATE TABLE IF NOT EXISTS "${table}" (\n${colDefs.join(",\n")}\n);\n\n`;
  }

  fs.writeFileSync(path.join(outDir, "schema.sql"), schemaSql, "utf8");
  console.log(`   ✅ schema.sql written (${tableNames.length} tables)\n`);

  // ── 3. Data export ─────────────────────────────────────────────────────
  console.log("📦 Exporting data...");

  // Export order: parent tables first (FK safety)
  const ORDER = [
    "tenants", "branches", "users", "customers",
    "eye_prescriptions", "products", "stocks",
    "suppliers", "lab_vendors",
    "shifts", "orders", "order_items",
    "job_tickets", "installments",
    "appointments", "claims",
    "stock_transfers", "commission_rules", "audit_logs",
  ];

  const orderedTables = [
    ...ORDER.filter((t) => tableNames.includes(t)),
    ...tableNames.filter((t) => !ORDER.includes(t)),
  ];

  let dataSql = `-- EyeFocus V2 — Data Export\n-- Generated: ${new Date().toISOString()}\n`;
  dataSql += `-- ⚠️  Contains real business data\n`;
  dataSql += `-- Restore order: run schema.sql first, then this file\n\n`;
  dataSql += `SET session_replication_role = replica; -- Disable FK checks during import\n\n`;

  const summary = [];

  for (const table of orderedTables) {
    try {
      const rows = await rawQuery(`SELECT * FROM "${table}" ORDER BY 1 LIMIT 10000`);
      dataSql += `-- ── ${table} ──────────────────────────────────────────\n`;
      dataSql += generateInserts(table, rows);
      summary.push({ table, rows: rows.length });
      console.log(`   ✅ ${table}: ${rows.length} rows`);
    } catch (e) {
      console.log(`   ⚠️  ${table}: ${e.message.slice(0, 80)}`);
    }
  }

  dataSql += `SET session_replication_role = DEFAULT;\n`;
  fs.writeFileSync(path.join(outDir, "data.sql"), dataSql, "utf8");

  // ── 4. Summary JSON ────────────────────────────────────────────────────
  const meta = {
    exportedAt: new Date().toISOString(),
    tables: summary,
    totalRows: summary.reduce((a, t) => a + t.rows, 0),
    source: "Neon PostgreSQL (ap-southeast-1)",
  };
  fs.writeFileSync(path.join(outDir, "export-meta.json"), JSON.stringify(meta, null, 2), "utf8");

  const dataSqlSize = fs.statSync(path.join(outDir, "data.sql")).size;
  console.log(`\n${"=".repeat(55)}`);
  console.log(`✅ Export complete!`);
  console.log(`   📁 db/backup/`);
  console.log(`   📐 schema.sql      — DDL (${tableNames.length} tables)`);
  console.log(`   💾 data.sql        — ${(dataSqlSize / 1024).toFixed(1)} KB`);
  console.log(`   📊 export-meta.json — ${summary.length} tables, ${meta.totalRows} rows total`);
}

exportDB().catch((e) => {
  console.error("Export failed:", e);
  process.exit(1);
});
