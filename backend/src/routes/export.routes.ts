import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { exportXML, exportJSON } from '../controllers/export.controller';

const router = Router();

// GET /api/export/xml - Admin only
router.get('/xml', authenticate, requireRole('admin'), exportXML);

// GET /api/export/json - Admin only
router.get('/json', authenticate, requireRole('admin'), exportJSON);

export default router;
