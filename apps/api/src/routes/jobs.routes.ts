import { Router } from 'express';
import {
  getJobs, getJobById, createJob,
  updateJobStatus, updateJob, assignWorkers, deleteJob,
} from '../controllers/jobs.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', requireRole('admin', 'manager'), createJob);
router.patch('/:id', requireRole('admin', 'manager'), updateJob);
router.patch('/:id/status', updateJobStatus);
router.post('/:id/assign', requireRole('admin', 'manager'), assignWorkers);
router.delete('/:id', requireRole('admin'), deleteJob);

export default router;
