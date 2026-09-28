import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '@/config/env';
import * as schema from './schema';
export const pool=new pg.Pool({connectionString:env.DATABASE_URL,max:20,idleTimeoutMillis:30000,connectionTimeoutMillis:5000});
export const db=drizzle(pool,{schema});
export type Database=typeof db;
export const checkDatabase=async()=>{await pool.query('SELECT 1');};
export const closeDatabase=()=>pool.end();
