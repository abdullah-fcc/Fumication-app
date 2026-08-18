import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
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
