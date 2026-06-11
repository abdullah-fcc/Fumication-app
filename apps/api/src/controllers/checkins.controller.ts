import { Response } from 'express';
import { pool } from '../db';
import type { AuthRequest } from '../middleware/auth';

export async function checkIn(req: AuthRequest, res: Response) {
  const { job_id, lat, lng } = req.body;
  if (!job_id || lat == null || lng == null) {
    res.status(400).json({ error: 'job_id, lat, and lng are required' });
    return;
  }
  const worker_id = req.user!.id;
  try {
    // Upsert: re-checking in updates the timestamp and coordinates
    const existing = await pool.query(
      'SELECT id FROM check_ins WHERE job_id = $1 AND worker_id = $2',
      [job_id, worker_id]
    );
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE check_ins
         SET lat = $1, lng = $2, checked_in_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [lat, lng, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO check_ins (job_id, worker_id, lat, lng)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [job_id, worker_id, lat, lng]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getCheckInsForJob(req: AuthRequest, res: Response) {
  const { jobId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.lat, ci.lng, ci.checked_in_at,
              u.name AS worker_name, u.email AS worker_email
       FROM check_ins ci
       JOIN users u ON u.id = ci.worker_id
       WHERE ci.job_id = $1
       ORDER BY ci.checked_in_at DESC`,
      [jobId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
