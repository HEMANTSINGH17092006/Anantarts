import { Pool } from 'pg';

let pool = null;

if (!pool && process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10, // Avoid connection exhaustion in serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export async function getClient() {
  if (!pool) {
    throw new Error('Database pool not initialized. Check DATABASE_URL.');
  }
  return await pool.connect();
}

/**
 * Executes a callback within a PostgreSQL transaction.
 * @param {Function} callback - Async function that receives the pg client
 */
export async function withTransaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
