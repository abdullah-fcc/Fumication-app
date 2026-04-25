import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../db';

export async function getUsers(req: AuthRequest, res: Response) {
  const { role } = req.query;
  try {
    const query = role
      ? 'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE role = $1 ORDER BY name'
      : 'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY name';
    const result = await pool.query(query, role ? [role] : []);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, avatar_url, is_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { name, phone, avatar_url, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        avatar_url = COALESCE($3, avatar_url),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, role, phone, avatar_url, is_active`,
      [name, phone, avatar_url, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
