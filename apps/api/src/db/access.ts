import { pool } from './index';

/**
 * Is this worker assigned to this job?
 *
 * The authorization boundary for field staff: role alone says a caller is *a*
 * worker, not that this particular job is theirs. Every worker-initiated read
 * or write of a single job goes through here.
 */
export async function isAssignedToJob(jobId: string, workerId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM job_assignments WHERE job_id = $1 AND worker_id = $2',
    [jobId, workerId]
  );
  return result.rows.length > 0;
}
