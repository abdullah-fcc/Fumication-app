import { Router } from 'express';
import {
  getInventory, getLowStock, createInventoryItem,
  updateInventoryItem, deleteInventoryItem,
} from '../controllers/inventory.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getInventory);
router.get('/low-stock', getLowStock);
router.post('/', requireRole('admin', 'manager'), createInventoryItem);
router.put('/:id', requireRole('admin', 'manager'), updateInventoryItem);
router.delete('/:id', requireRole('admin'), deleteInventoryItem);

export default router;
