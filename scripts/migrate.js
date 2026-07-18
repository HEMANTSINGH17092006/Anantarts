const { Pool } = require('pg');
const { initDb } = require('../db');
require('dotenv').config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === '') {
    console.log('[Migration] DATABASE_URL is not set. Operating in SQLite fallback or ignoring PostgreSQL checks.');
    // Let initDb handle SQLite if that's the setup
    try {
      await initDb();
      console.log('[Migration] Database initialised successfully.');
      process.exit(0);
    } catch (err) {
      console.error('[Migration] Initialization failed:', err.message);
      process.exit(1);
    }
  }

  console.log('[Migration] Directing PostgreSQL Pool for Supabase connection...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const timestamp = Date.now();
  const tablesToBackup = ['products', 'orders', 'website_settings', 'categories', 'coupons', 'blogs'];

  try {
    // 1. Run Snapshot Backups of Existing Production Data
    console.log('[Migration] Checking active schema for tables to back up...');
    
    for (const table of tablesToBackup) {
      // Check if table exists
      const checkRes = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

      const exists = checkRes.rows[0]?.exists;

      if (exists) {
        const backupTableName = `backups_${table}_${timestamp}`;
        console.log(`[Backup] Creating snapshot: copying ${table} into ${backupTableName}...`);
        await pool.query(`CREATE TABLE "${backupTableName}" AS SELECT * FROM "${table}";`);
      } else {
        console.log(`[Backup] Table ${table} does not exist yet. Skipping backup copy.`);
      }
    }

    console.log('[Backup] Production snapshot backups completed.');

  } catch (err) {
    console.error('[Backup] Warning: Backup snapshot failed. Aborting database migrations to protect data.', err.message);
    await pool.end();
    process.exit(1);
  } finally {
    // End pool so we don't hold open connections
    await pool.end();
  }

  // 2. Initialize/Upgrade Database tables using initDb helper
  try {
    console.log('[Migration] Running database schemas and column initializations...');
    await initDb();
    console.log('[Migration] All migrations applied successfully without errors.');
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Failed to apply schema updates:', err.message);
    process.exit(1);
  }
}

runMigrations();
