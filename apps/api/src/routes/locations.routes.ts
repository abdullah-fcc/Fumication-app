import { Router } from 'express';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/locations.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/',     getLocations);
router.post('/',    requireRole('admin', 'manager'), createLocation);
router.put('/:id',  requireRole('admin', 'manager'), updateLocation);
router.delete('/:id', requireRole('admin'),          deleteLocation);

export default router;
