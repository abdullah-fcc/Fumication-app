import { Router } from 'express';
import { getReports, getReportByJob, getReportById, createReport } from '../controllers/reports.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getReports);
router.get('/job/:jobId', getReportByJob);
router.get('/:id', getReportById);
// Clients view reports, they don't file them — only field staff/management do.
router.post('/', requireRole('admin', 'manager', 'worker'), createReport);

export default router;
