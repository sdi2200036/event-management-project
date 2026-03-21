import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  createBooking,
  getBookingsByEvent,
  getMyBookings,
  cancelBooking,
} from '../controllers/bookings.controller';

const router = Router();

// POST /api/bookings - Participant: create a booking
router.post('/', authenticate, requireRole('participant'), createBooking);

// GET /api/bookings/my - Participant: get own bookings
router.get('/my', authenticate, requireRole('participant'), getMyBookings);

// GET /api/bookings/event/:id - Organizer or Admin: get bookings for an event
router.get('/event/:id', authenticate, requireRole('organizer', 'admin'), getBookingsByEvent);

// PATCH /api/bookings/:id/cancel - Participant: cancel a booking
router.patch('/:id/cancel', authenticate, requireRole('participant'), cancelBooking);

export default router;
