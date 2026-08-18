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
  // Verify the server certificate. Previously this was disabled, which left
  // the connection encrypted but unauthenticated — anyone able to intercept
  // the path to the database could present their own cert and read the lot.
  // Neon serves a publicly-trusted certificate, so the default CA store works.
  ssl: { rejectUnauthorized: true },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});
