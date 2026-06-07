import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  deleteEvent,
  getOrganizerEvents,
  getRecommendations,
} from '../controllers/events.controller';

const router = Router();

// GET /api/events - Public: search/list events
router.get('/', getEvents);

// GET /api/events/my - Organizer: list own events
router.get('/my', authenticate, requireRole('organizer', 'admin'), getOrganizerEvents);

// GET /api/events/recommendations - Authenticated: get recommendations
router.get('/recommendations', authenticate, getRecommendations);

// GET /api/events/:id - Public: get event details (optional auth to track views)
router.get('/:id', optionalAuthenticate, getEventById);

// POST /api/events - Organizer only: create event
router.post('/', authenticate, requireRole('organizer'), createEvent);

// PUT /api/events/:id - Organizer only: update event
router.put('/:id', authenticate, requireRole('organizer', 'admin'), updateEvent);

// PATCH /api/events/:id/publish - Organizer only: publish event
router.patch('/:id/publish', authenticate, requireRole('organizer'), publishEvent);

// PATCH /api/events/:id/cancel - Organizer or Admin: cancel event
router.patch('/:id/cancel', authenticate, requireRole('organizer', 'admin'), cancelEvent);

// DELETE /api/events/:id - Organizer or Admin: delete draft event
router.delete('/:id', authenticate, requireRole('organizer', 'admin'), deleteEvent);

export default router;
