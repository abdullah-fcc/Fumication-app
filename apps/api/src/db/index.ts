import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawUrl = process.env.DATABASE_URL ?? '';
const connectionString = rawUrl
  .replace(/sslmode=[^&]*/g, '')
  .replace(/channel_binding=[^&]*/g, '')
  .replace(/&&+/g, '&')
  .replace(/[?&]+$/, '');

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});
