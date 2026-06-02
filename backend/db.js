import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// BIGINT (OID 20) arriva come stringa da pg — convertiamo a Number.
// I nostri valori (max ~60M token) sono ben al di sotto di Number.MAX_SAFE_INTEGER.
pg.types.setTypeParser(20, val => (val === null ? null : parseInt(val, 10)));

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

export default pool;
