import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

// Roles a user may grant themselves via the public /register endpoint.
// Admin and manager accounts are provisioned by an existing admin (see
// apps/web register page comment) — never trust a role value an
// unauthenticated caller hands us for those elevated roles.
const SELF_REGISTER_ROLES = ['worker', 'client'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254 || !EMAIL_REGEX.test(trimmed)) return null;
  return trimmed;
}

const POSTGRES_UNIQUE_VIOLATION = '23505';

export async function register(req: Request, res: Response) {
  const { name, password, role, phone } = req.body;
  if (typeof name !== 'string' || !name.trim() || typeof password !== 'string' || !role) {
    res.status(400).json({ error: 'name, email, password and role are required' });
    return;
  }
  const email = normalizeEmail(req.body.email);
  if (!email) {
    res.status(400).json({ error: 'Enter a valid email address' });
    return;
  }
  // 12 is the floor for new accounts. Length beats composition rules, and an
  // 8-character password falls to an offline guess quickly.
  if (password.length < 12 || password.length > 128) {
    res.status(400).json({ error: 'Password must be between 12 and 128 characters' });
    return;
  }
  if (!SELF_REGISTER_ROLES.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${SELF_REGISTER_ROLES.join(', ')}` });
    return;
  }
  try {
    // The DB has a case-insensitive unique index on email as the source of truth
    // for uniqueness (handles concurrent requests) — this lookup is just to
    // return a friendlier error than a raw constraint-violation message.
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [name.trim(), email, hash, role, phone || null]
    );
    const user = result.rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (err: any) {
    if (err?.code === POSTGRES_UNIQUE_VIOLATION) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    console.error('register failed:', err?.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req: Request, res: Response) {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || typeof password !== 'string' || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, password_hash, is_active FROM users WHERE LOWER(email) = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      // Always run a bcrypt comparison even when there's no matching user, so the
      // response time doesn't reveal whether the email is registered (timing side-channel).
      await bcrypt.compare(password, '$2a$10$invalidsaltinvalidsaltinvalidsa');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    if (user.is_active === false) {
      res.status(403).json({ error: 'This account has been deactivated' });
      return;
    }
    const { password_hash: _, is_active: __, ...safeUser } = user;
    res.json({ user: safeUser, token: signToken(safeUser) });
  } catch (err) {
    console.error('login failed:', (err as Error)?.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function me(req: Request & { user?: any }, res: Response) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
