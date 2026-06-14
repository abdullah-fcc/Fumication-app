import { Router } from 'express';
import { checkIn, getCheckInsForJob } from '../controllers/checkins.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Worker submits their GPS location for a job
router.post('/', authenticate, requireRole('worker'), checkIn);

// Admin/manager see who checked in; workers can check their own check-in status
router.get('/job/:jobId', authenticate, requireRole('admin', 'manager', 'worker'), getCheckInsForJob);

export default router;
