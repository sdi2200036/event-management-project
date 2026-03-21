import { query } from '../config/database';
import { Booking, BookingWithDetails, CreateBookingDTO } from '../models/booking.model';

export const createBooking = async (attendeeId: number, dto: CreateBookingDTO): Promise<Booking> => {
  const { event_id, ticket_type_id, number_of_tickets } = dto;

  // Validate event exists and is published
  const eventResult = await query(
    "SELECT * FROM events WHERE id = $1 AND status = 'PUBLISHED'",
    [event_id]
  );
  if (eventResult.rows.length === 0) {
    throw new Error('Event not found or not available for booking');
  }

  // Validate ticket type belongs to event and has availability
  const ttResult = await query(
    'SELECT * FROM ticket_types WHERE id = $1 AND event_id = $2',
    [ticket_type_id, event_id]
  );
  if (ttResult.rows.length === 0) {
    throw new Error('Ticket type not found for this event');
  }

  const ticketType = ttResult.rows[0];
  if (ticketType.available < number_of_tickets) {
    throw new Error(`Only ${ticketType.available} ticket(s) available`);
  }

  const total_cost = ticketType.price * number_of_tickets;

  // Create booking in a transaction
  await query('BEGIN');
  try {
    const bookingResult = await query(
      `INSERT INTO bookings (event_id, attendee_id, ticket_type_id, number_of_tickets, total_cost, booking_status)
       VALUES ($1,$2,$3,$4,$5,'CONFIRMED') RETURNING *`,
      [event_id, attendeeId, ticket_type_id, number_of_tickets, total_cost]
    );

    // Decrement available count
    await query(
      'UPDATE ticket_types SET available = available - $1 WHERE id = $2',
      [number_of_tickets, ticket_type_id]
    );

    await query('COMMIT');
    return bookingResult.rows[0];
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
};

export const getBookingsByEvent = async (eventId: number): Promise<BookingWithDetails[]> => {
  const result = await query(
    `SELECT b.*, u.username as attendee_username, u.email as attendee_email,
            u.first_name, u.last_name,
            tt.name as ticket_type_name, tt.price as ticket_type_price
     FROM bookings b
     JOIN users u ON u.id = b.attendee_id
     JOIN ticket_types tt ON tt.id = b.ticket_type_id
     WHERE b.event_id = $1
     ORDER BY b.booked_at DESC`,
    [eventId]
  );
  return result.rows;
};

export const getBookingsByUser = async (userId: number): Promise<BookingWithDetails[]> => {
  const result = await query(
    `SELECT b.*, e.title as event_title, e.start_datetime as event_start_datetime,
            tt.name as ticket_type_name, tt.price as ticket_type_price
     FROM bookings b
     JOIN events e ON e.id = b.event_id
     JOIN ticket_types tt ON tt.id = b.ticket_type_id
     WHERE b.attendee_id = $1
     ORDER BY b.booked_at DESC`,
    [userId]
  );
  return result.rows;
};

export const cancelBooking = async (bookingId: number, userId: number): Promise<void> => {
  const result = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
  if (result.rows.length === 0) throw new Error('Booking not found');

  const booking = result.rows[0];
  if (booking.attendee_id !== userId) throw new Error('Not authorized to cancel this booking');
  if (booking.booking_status === 'CANCELLED') throw new Error('Booking already cancelled');

  await query('BEGIN');
  try {
    await query("UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = $1", [bookingId]);
    await query(
      'UPDATE ticket_types SET available = available + $1 WHERE id = $2',
      [booking.number_of_tickets, booking.ticket_type_id]
    );
    await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
};
