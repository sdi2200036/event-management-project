import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  getAllUsers,
  getUserById,
  approveUser,
  rejectUser,
  updateUser,
} from '../controllers/users.controller';

const router = Router();

// GET /api/users - Admin only: list all users
router.get('/', authenticate, requireRole('admin'), getAllUsers);

// GET /api/users/:id - Authenticated: get user by id
router.get('/:id', authenticate, getUserById);

// PATCH /api/users/:id - Authenticated: update own profile (admin can update any)
router.patch('/:id', authenticate, updateUser);

// PATCH /api/users/:id/approve - Admin only
router.patch('/:id/approve', authenticate, requireRole('admin'), approveUser);

// PATCH /api/users/:id/reject - Admin only
router.patch('/:id/reject', authenticate, requireRole('admin'), rejectUser);

export default router;
