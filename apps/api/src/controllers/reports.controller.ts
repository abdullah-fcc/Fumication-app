import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../db';

// Workers only see reports they filed; clients only see reports for jobs at
// their own locations; admins/managers see everything. Prevents one worker
// or client from reading another's job/report data.
function scopeToRole(req: AuthRequest, query: string, params: any[]): string {
  const role = req.user!.role;
  if (role === 'worker') {
    params.push(req.user!.id);
    return `${query} WHERE r.worker_id = $${params.length}`;
  }
  if (role === 'client') {
    params.push(req.user!.id);
    return `${query} WHERE l.client_id = $${params.length}`;
  }
  return query;
}

export async function getReports(req: AuthRequest, res: Response) {
  try {
    const params: any[] = [];
    const query = scopeToRole(
      req,
      `SELECT r.*, j.title as job_title, l.name as location_name, u.name as worker_name
       FROM reports r
       LEFT JOIN jobs j ON r.job_id = j.id
       LEFT JOIN locations l ON j.location_id = l.id
       LEFT JOIN users u ON r.worker_id = u.id`,
      params
    );
    const result = await pool.query(`${query} ORDER BY r.created_at DESC`, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getReportByJob(req: AuthRequest, res: Response) {
  try {
    const params: any[] = [req.params.jobId];
    let query = `SELECT r.*, u.name as worker_name FROM reports r
       LEFT JOIN jobs j ON r.job_id = j.id
       LEFT JOIN locations l ON j.location_id = l.id
       LEFT JOIN users u ON r.worker_id = u.id
       WHERE r.job_id = $1`;
    const role = req.user!.role;
    if (role === 'worker') {
      params.push(req.user!.id);
      query += ` AND r.worker_id = $${params.length}`;
    } else if (role === 'client') {
      params.push(req.user!.id);
      query += ` AND l.client_id = $${params.length}`;
    }
    const result = await pool.query(query, params);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getReportById(req: AuthRequest, res: Response) {
  try {
    const params: any[] = [req.params.id];
    let query = `SELECT r.*, j.title as job_title, l.name as location_name, l.address as location_address,
              u.name as worker_name
       FROM reports r
       LEFT JOIN jobs j ON r.job_id = j.id
       LEFT JOIN locations l ON j.location_id = l.id
       LEFT JOIN users u ON r.worker_id = u.id
       WHERE r.id = $1`;
    const role = req.user!.role;
    if (role === 'worker') {
      params.push(req.user!.id);
      query += ` AND r.worker_id = $${params.length}`;
    } else if (role === 'client') {
      params.push(req.user!.id);
      query += ` AND l.client_id = $${params.length}`;
    }
    const result = await pool.query(query, params);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createReport(req: AuthRequest, res: Response) {
  const {
    job_id, pests_found, areas_treated, before_photos,
    after_photos, worker_signature, client_signature, client_name,
    notes, chemicals_used, form_data,
  } = req.body;

  if (!job_id) {
    res.status(400).json({ error: 'job_id is required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reportResult = await client.query(
      `INSERT INTO reports
        (job_id, worker_id, pests_found, areas_treated, before_photos,
         after_photos, worker_signature, client_signature, client_name, notes, form_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (job_id) DO UPDATE SET
         pests_found = EXCLUDED.pests_found,
         areas_treated = EXCLUDED.areas_treated,
         before_photos = EXCLUDED.before_photos,
         after_photos = EXCLUDED.after_photos,
         worker_signature = EXCLUDED.worker_signature,
         client_signature = EXCLUDED.client_signature,
         client_name = EXCLUDED.client_name,
         notes = EXCLUDED.notes,
         form_data = EXCLUDED.form_data
       RETURNING *`,
      [
        job_id, req.user!.id, pests_found, areas_treated,
        before_photos, after_photos, worker_signature,
        client_signature, client_name, notes, form_data,
      ]
    );
    const report = reportResult.rows[0];

    if (chemicals_used?.length) {
      for (const chem of chemicals_used) {
        await client.query(
          `INSERT INTO report_chemicals (report_id, inventory_id, quantity_used, unit)
           VALUES ($1, $2, $3, $4)`,
          [report.id, chem.inventory_id, chem.quantity_used, chem.unit]
        );
        await client.query(
          'UPDATE inventory SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2',
          [chem.quantity_used, chem.inventory_id]
        );
      }
    }

    await client.query(
      `UPDATE jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [job_id]
    );

    await client.query('COMMIT');
    res.status(201).json(report);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}
