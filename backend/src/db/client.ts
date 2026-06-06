import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const log = (msg: string, data?: unknown) => {
  console.log(`[${new Date().toISOString()}] [DB] ${msg}`, data ?? '');
};

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let pool: Pool;

export function getDb(): Pool {
  if (!pool) {
    const url = (process.env.DATABASE_URL || '').replace(/\/\/.*:.*@/, '//***:***@');
    log('Creating PostgreSQL pool', { url });
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });

    pool.on('connect', () => log('New DB connection acquired'));
    pool.on('error', (err) => log('Pool error', { error: err.message }));
  }
  return pool;
}

export async function initSchema(): Promise<void> {
  log('Running schema initialization');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const db = getDb();
  await db.query(schema);
  log('Schema initialization complete');
}
