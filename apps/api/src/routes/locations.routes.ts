import { Router } from 'express';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/locations.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Locations aren't on the worker/client nav (see apps/web rbac.ts) — match that here.
router.get('/',     requireRole('admin', 'manager'), getLocations);
router.post('/',    requireRole('admin', 'manager'), createLocation);
router.put('/:id',  requireRole('admin', 'manager'), updateLocation);
router.delete('/:id', requireRole('admin'),          deleteLocation);

export default router;
