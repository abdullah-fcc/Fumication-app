import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate, requireRole, requireSelfOrRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'manager'), getUsers);
router.get('/:id', requireSelfOrRole('id', 'admin', 'manager'), getUserById);
router.put('/:id', requireSelfOrRole('id', 'admin', 'manager'), updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
