import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../db';

export async function getLocations(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT id, name, address, lat, lng, contact_person, contact_phone, client_id
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
      [name, address, lat, lng, contact_person, contact_phone, client_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
