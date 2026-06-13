import { Router } from 'express';
import { getReports, getReportByJob, getReportById, createReport } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getReports);
router.get('/job/:jobId', getReportByJob);
router.get('/:id', getReportById);
router.post('/', createReport);

export default router;
