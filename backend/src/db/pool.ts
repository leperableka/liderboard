import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Required environment variable "${name}" is not set`);
  return value;
}

const pool = new Pool({
  host: requireEnv('POSTGRES_HOST'),
  port: parseInt(process.env['POSTGRES_PORT'] ?? '5432', 10),
  database: requireEnv('POSTGRES_DB'),
  user: requireEnv('POSTGRES_USER'),
  password: requireEnv('POSTGRES_PASSWORD'),
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

export default pool;
