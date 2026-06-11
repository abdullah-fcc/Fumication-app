import { Router } from 'express';
import { checkIn, getCheckInsForJob } from '../controllers/checkins.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Worker submits their GPS location for a job
router.post('/', authenticate, requireRole('worker'), checkIn);

// Admin / manager sees who checked in to a specific job
router.get('/job/:jobId', authenticate, requireRole('admin', 'manager'), getCheckInsForJob);

export default router;
