import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getInbox,
  getSent,
  sendMessage,
  deleteMessage,
  markAsRead,
  getUnreadCount,
} from '../controllers/messages.controller';

const router = Router();

// All message routes require authentication
router.use(authenticate);

// GET /api/messages/inbox
router.get('/inbox', getInbox);

// GET /api/messages/sent
router.get('/sent', getSent);

// GET /api/messages/unread-count
router.get('/unread-count', getUnreadCount);

// POST /api/messages
router.post('/', sendMessage);

// PATCH /api/messages/:id/read
router.patch('/:id/read', markAsRead);

// DELETE /api/messages/:id
router.delete('/:id', deleteMessage);

export default router;
