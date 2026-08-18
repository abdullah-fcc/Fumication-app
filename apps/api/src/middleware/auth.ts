import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  let decoded: { id: string; role: string; email: string };
  try {
    // The secret is read here rather than at module scope: this file is
    // imported before dotenv.config() runs in some entrypoints, so a top-level
    // read could capture undefined. index.ts asserts it exists at startup.
    // The algorithm is pinned so a future key-type change can't open the door
    // to algorithm confusion; this codebase only ever signs with HS256.
    decoded = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as typeof decoded;
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Role and account status live in a 7-day token, so trusting the claims
  // alone meant deactivating or demoting someone didn't take effect until it
  // expired. Re-read the row so those changes apply on the very next request.
  try {
    const result = await pool.query(
      'SELECT role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];
    if (!user || user.is_active === false) {
      res.status(401).json({ error: 'Account is no longer active' });
      return;
    }
    req.user = { id: decoded.id, email: decoded.email, role: user.role };
    next();
  } catch (err) {
    console.error('authenticate failed:', (err as Error)?.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

// Allows a request through if the caller is acting on their own record
// (req.params[idParam] matches their own id) OR holds one of the given roles.
// Used to stop users from reading/editing other accounts by changing the
// :id in the URL (insecure direct object reference).
export function requireSelfOrRole(idParam: string, ...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    if (req.user.id === req.params[idParam] || roles.includes(req.user.role)) {
      next();
      return;
    }
    res.status(403).json({ error: 'Insufficient permissions' });
  };
}
