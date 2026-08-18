import { Response } from 'express';
import { pool } from '../db';
import type { AuthRequest } from '../middleware/auth';

// Great-circle distance in metres. Used to decide whether a check-in actually
// happened at the client's premises rather than trusting the device's word.
function distanceMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function checkIn(req: AuthRequest, res: Response) {
  const { job_id } = req.body;
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  if (!job_id || req.body.lat == null || req.body.lng == null) {
    res.status(400).json({ error: 'job_id, lat, and lng are required' });
    return;
  }
  // Coordinates arrive from the device and were previously stored unchecked.
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
    res.status(400).json({ error: 'lat must be between -90 and 90, lng between -180 and 180' });
    return;
  }
  const worker_id = req.user!.id;
  try {
    const assignment = await pool.query(
      'SELECT 1 FROM job_assignments WHERE job_id = $1 AND worker_id = $2',
      [job_id, worker_id]
    );
    if (assignment.rows.length === 0) {
      res.status(403).json({ error: 'You are not assigned to this job' });
      return;
    }

    // The schema has always had is_within_geofence, but nothing ever set it —
    // every row read `false`, so a check-in from anywhere looked identical to
    // one on site. Compute it here against the job's location.
    const site = await pool.query(
      `SELECT l.lat, l.lng, l.geo_fence_radius
       FROM jobs j JOIN locations l ON j.location_id = l.id
       WHERE j.id = $1`,
      [job_id]
    );
    const loc = site.rows[0];
    const withinGeofence =
      loc?.lat != null && loc?.lng != null
        ? distanceMetres(lat, lng, Number(loc.lat), Number(loc.lng)) <= (loc.geo_fence_radius ?? 100)
        : false;

    // Upsert: re-checking in updates the timestamp and coordinates
    const existing = await pool.query(
      'SELECT id FROM check_ins WHERE job_id = $1 AND worker_id = $2',
      [job_id, worker_id]
    );
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE check_ins
         SET lat = $1, lng = $2, checked_in_at = NOW(), is_within_geofence = $3
         WHERE id = $4
         RETURNING *`,
        [lat, lng, withinGeofence, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO check_ins (job_id, worker_id, lat, lng, is_within_geofence)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [job_id, worker_id, lat, lng, withinGeofence]
      );
    }

    // First check-in on a scheduled job starts it and the work timer
    await pool.query(
      `UPDATE jobs SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'scheduled'`,
      [job_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getCheckInsForJob(req: AuthRequest, res: Response) {
  const { jobId } = req.params;
  try {
    // Workers use this to see their own check-in state, so they get only their
    // own rows. Previously any worker could read the whole crew's movements —
    // names, emails and coordinates — for any job id they cared to guess.
    const params: any[] = [jobId];
    let scope = '';
    if (req.user!.role === 'worker') {
      params.push(req.user!.id);
      scope = ` AND ci.worker_id = $${params.length}`;
    }
    // Management legitimately needs crew contact details; field staff don't.
    const contactField = req.user!.role === 'worker' ? '' : ', u.email AS worker_email';
    const result = await pool.query(
      `SELECT ci.id, ci.worker_id, ci.lat, ci.lng, ci.checked_in_at,
              ci.is_within_geofence, u.name AS worker_name${contactField}
       FROM check_ins ci
       JOIN users u ON u.id = ci.worker_id
       WHERE ci.job_id = $1${scope}
       ORDER BY ci.checked_in_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
