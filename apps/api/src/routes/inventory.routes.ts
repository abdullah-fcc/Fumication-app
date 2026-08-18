import { Router } from 'express';
import {
  getInventory, getLowStock, createInventoryItem,
  updateInventoryItem, deleteInventoryItem,
} from '../controllers/inventory.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Inventory isn't on the worker/client nav (see apps/web rbac.ts) — match that here.
router.get('/', requireRole('admin', 'manager'), getInventory);
router.get('/low-stock', requireRole('admin', 'manager'), getLowStock);
router.post('/', requireRole('admin', 'manager'), createInventoryItem);
router.put('/:id', requireRole('admin', 'manager'), updateInventoryItem);
router.delete('/:id', requireRole('admin'), deleteInventoryItem);

export default router;
