require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT * FROM otps ORDER BY created_at DESC LIMIT 5');
    console.log("OTPS in DB:", res.rows);
  } catch(e) {
    console.error("Error querying OTPS:", e);
  }
  pool.end();
}

test();
