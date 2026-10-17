import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '@/config/env';
import * as schema from './schema';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS
});
export const db = drizzle(pool, { schema });
export type Database = typeof db;
export const checkDatabase = async () => { await pool.query('SELECT 1'); };
export const closeDatabase = () => pool.end();
export const getDatabasePoolStatus = () => ({ total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount, max: env.DB_POOL_MAX });
