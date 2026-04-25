import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'manager'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
