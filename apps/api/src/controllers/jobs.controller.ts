import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../db';

export async function getJobs(req: AuthRequest, res: Response) {
  const { status, worker_id } = req.query;
  try {
    let query = `
      SELECT j.*, l.name as location_name, l.address as location_address,
             u.name as created_by_name
      FROM jobs j
      LEFT JOIN locations l ON j.location_id = l.id
      LEFT JOIN users u ON j.created_by = u.id`;
    const params: any[] = [];

    if (worker_id) {
      query += ` JOIN job_assignments ja ON j.id = ja.job_id WHERE ja.worker_id = $${params.length + 1}`;
      params.push(worker_id);
      if (status) {
        query += ` AND j.status = $${params.length + 1}`;
        params.push(status);
      }
    } else if (status) {
      query += ` WHERE j.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY j.scheduled_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getJobById(req: AuthRequest, res: Response) {
  try {
    const jobResult = await pool.query(
      `SELECT j.*, l.name as location_name, l.address, l.lat, l.lng, l.geo_fence_radius
       FROM jobs j LEFT JOIN locations l ON j.location_id = l.id WHERE j.id = $1`,
      [req.params.id]
    );
    if (!jobResult.rows[0]) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    const workersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone FROM users u
       JOIN job_assignments ja ON u.id = ja.worker_id WHERE ja.job_id = $1`,
      [req.params.id]
    );
    res.json({ ...jobResult.rows[0], workers: workersResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createJob(req: AuthRequest, res: Response) {
  const { title, description, location_id, scheduled_at, notes, worker_ids } = req.body;
  if (!title || !location_id || !scheduled_at) {
    res.status(400).json({ error: 'title, location_id and scheduled_at are required' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const jobResult = await client.query(
      `INSERT INTO jobs (title, description, location_id, scheduled_at, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, location_id, scheduled_at, notes, req.user!.id]
    );
    const job = jobResult.rows[0];
    if (worker_ids?.length) {
      for (const wid of worker_ids) {
        await client.query(
          'INSERT INTO job_assignments (job_id, worker_id) VALUES ($1, $2)',
          [job.id, wid]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(job);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

export async function updateJobStatus(req: AuthRequest, res: Response) {
  const { status, notes } = req.body;
  const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  try {
    const timestamps: Record<string, string> = {
      in_progress: ', started_at = NOW()',
      completed: ', completed_at = NOW()',
    };
    const extra = timestamps[status] || '';
    const result = await pool.query(
      `UPDATE jobs SET status = $1${extra}, notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function assignWorkers(req: AuthRequest, res: Response) {
  const { worker_ids } = req.body;
  if (!Array.isArray(worker_ids)) {
    res.status(400).json({ error: 'worker_ids array is required' });
    return;
  }
  try {
    await pool.query('DELETE FROM job_assignments WHERE job_id = $1', [req.params.id]);
    for (const wid of worker_ids) {
      await pool.query(
        'INSERT INTO job_assignments (job_id, worker_id) VALUES ($1, $2)',
        [req.params.id, wid]
      );
    }
    res.json({ message: 'Workers assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteJob(req: AuthRequest, res: Response) {
  try {
    await pool.query('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
