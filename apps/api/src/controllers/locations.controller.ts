import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../db';

export async function getLocations(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT id, name, address, lat, lng, contact_person, contact_phone, client_id, created_at
       FROM locations ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createLocation(req: AuthRequest, res: Response) {
  const { name, address, lat, lng, contact_person, contact_phone, client_id } = req.body;
  if (!name || !address) {
    res.status(400).json({ error: 'name and address are required' });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO locations (name, address, lat, lng, contact_person, contact_phone, client_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, address, lat ?? null, lng ?? null, contact_person ?? null, contact_phone ?? null, client_id ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateLocation(req: AuthRequest, res: Response) {
  const { name, address, lat, lng, contact_person, contact_phone } = req.body;
  if (!name || !address) {
    res.status(400).json({ error: 'name and address are required' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE locations SET
         name           = $1,
         address        = $2,
         lat            = $3,
         lng            = $4,
         contact_person = $5,
         contact_phone  = $6,
         updated_at     = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, address, lat ?? null, lng ?? null, contact_person ?? null, contact_phone ?? null, req.params.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteLocation(req: AuthRequest, res: Response) {
  try {
    await pool.query('DELETE FROM locations WHERE id = $1', [req.params.id]);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
