import { Router } from 'express';
import {
  getJobs, getJobById, createJob,
  updateJobStatus, updateJob, assignWorkers, deleteJob,
} from '../controllers/jobs.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Clients don't have a jobs view (they only see their own reports) — keep
// the API in sync with that so a client token can't enumerate every job.
router.get('/', requireRole('admin', 'manager', 'worker'), getJobs);
router.get('/:id', requireRole('admin', 'manager', 'worker'), getJobById);
router.post('/', requireRole('admin', 'manager'), createJob);
router.patch('/:id', requireRole('admin', 'manager'), updateJob);
router.patch('/:id/status', requireRole('admin', 'manager', 'worker'), updateJobStatus);
router.post('/:id/assign', requireRole('admin', 'manager'), assignWorkers);
router.delete('/:id', requireRole('admin'), deleteJob);

export default router;
