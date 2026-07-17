const { Pool } = require('pg');

const connectionString = "postgresql://postgres.bpysijuecdmadnqsjsym:9jm0c0lj4pqhN6qF@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Testing connection to bpysijuecdmadnqsjsym pooler with new password...');
  const res = await pool.query("SELECT 1 as val");
  console.log('SUCCESS! Connection works with new password! Val:', res.rows[0].val);
  await pool.end();
}

main().catch(err => {
  console.error('FAILED:', err.message || err);
  process.exit(1);
});
