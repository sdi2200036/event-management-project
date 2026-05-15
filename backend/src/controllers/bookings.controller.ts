import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as bookingService from '../services/booking.service';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await bookingService.createBooking(req.user!.id, req.body);
    res.status(201).json(booking);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getBookingsByEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = parseInt(req.params.id, 10);

    // Organizers can only see their own event bookings; admins see all
    if (req.user!.role === 'organizer') {
      const { default: prisma } = await import('../config/prisma');
      const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizer_id: true } });
      if (!event || event.organizer_id !== req.user!.id) {
        res.status(403).json({ message: 'Not authorized to view these bookings' });
        return;
      }
    }

    const bookings = await bookingService.getBookingsByEvent(eventId);
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await bookingService.getBookingsByUser(req.user!.id);
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await bookingService.cancelBooking(parseInt(req.params.id, 10), req.user!.id);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
