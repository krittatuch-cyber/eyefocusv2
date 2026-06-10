// scripts/check-columns.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const cols = await sql`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'customers' 
  ORDER BY ordinal_position
`;
console.log("customers columns:", cols.map(c => c.column_name));

const rxCols = await sql`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'eye_prescriptions' 
  ORDER BY ordinal_position
`;
console.log("eye_prescriptions columns:", rxCols.map(c => c.column_name));
process.exit(0);
