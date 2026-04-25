import { Router } from 'express';
import { getLocations, createLocation } from '../controllers/locations.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/',  getLocations);
router.post('/', requireRole('admin', 'manager'), createLocation);

export default router;
