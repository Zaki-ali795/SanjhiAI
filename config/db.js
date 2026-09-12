// db.js
// Flexible PostgreSQL connection: works with a full connection string
// (e.g. Supabase) OR individual local DB params.

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const useConnectionString = !!process.env.DATABASE_URL;

const poolConfig = useConnectionString
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === 'false'
          ? false
          : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mydb',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
});

// Handle idle client connection drops gracefully without crashing server
pool.on('error', (err) => {
  console.warn('⚠️ PostgreSQL pool client error (idle connection drop):', err.message);
});

// Resilient query helper with automatic single retry on network/idle socket drops
export const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    const isConnErr = err.code === 'ECONNRESET' ||
      (err.message && (
        err.message.includes('closed') ||
        err.message.includes('terminated') ||
        err.message.includes('socket')
      ));

    if (isConnErr) {
      console.warn('⚠️ PostgreSQL socket dropped. Retrying query automatically...', err.message);
      return await pool.query(text, params);
    }
    throw err;
  }
};

// Runs once at startup to confirm the DB is actually reachable.
// Call this from server.js right after imports.
export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    console.log(
      `✅ PostgreSQL connected (${useConnectionString ? 'connection string' : 'local params'}) — server time: ${result.rows[0].current_time}`
    );
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    return false;
  }
};

export { pool };