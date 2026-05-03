import pool, { query } from '../config/database';
import { Booking, BookingWithDetails, CreateBookingDTO } from '../models/booking.model';

export const createBooking = async (attendeeId: number, dto: CreateBookingDTO): Promise<Booking> => {
  const { event_id, ticket_type_id, number_of_tickets } = dto;

  // Validate event exists and is published (outside transaction — read-only check)
  const eventResult = await query(
    "SELECT id FROM events WHERE id = $1 AND status = 'PUBLISHED'",
    [event_id]
  );
  if (eventResult.rows.length === 0) {
    throw new Error('Event not found or not available for booking');
  }

  // Validate ticket type belongs to event (outside transaction — read-only check)
  const ttCheck = await query(
    'SELECT id FROM ticket_types WHERE id = $1 AND event_id = $2',
    [ticket_type_id, event_id]
  );
  if (ttCheck.rows.length === 0) {
    throw new Error('Ticket type not found for this event');
  }

  // Use a dedicated client so BEGIN/COMMIT/ROLLBACK stay on the same connection
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the ticket_type row to prevent concurrent overbooking (fixes race condition)
    const ttResult = await client.query(
      'SELECT * FROM ticket_types WHERE id = $1 FOR UPDATE',
      [ticket_type_id]
    );
    const ticketType = ttResult.rows[0];

    if (ticketType.available < number_of_tickets) {
      throw new Error(`Only ${ticketType.available} ticket(s) available`);
    }

    // Check total event capacity is not exceeded
    const capacityResult = await client.query(
      `SELECT e.capacity,
              COALESCE(SUM(b.number_of_tickets), 0) AS booked
       FROM events e
       LEFT JOIN bookings b ON b.event_id = e.id AND b.booking_status = 'CONFIRMED'
       WHERE e.id = $1
       GROUP BY e.capacity`,
      [event_id]
    );
    const { capacity, booked } = capacityResult.rows[0];
    if (parseInt(booked, 10) + number_of_tickets > parseInt(capacity, 10)) {
      throw new Error('Not enough capacity remaining for this event');
    }

    const total_cost = parseFloat(ticketType.price) * number_of_tickets;

    const bookingResult = await client.query(
      `INSERT INTO bookings (event_id, attendee_id, ticket_type_id, number_of_tickets, total_cost, booking_status)
       VALUES ($1,$2,$3,$4,$5,'CONFIRMED') RETURNING *`,
      [event_id, attendeeId, ticket_type_id, number_of_tickets, total_cost]
    );

    await client.query(
      'UPDATE ticket_types SET available = available - $1 WHERE id = $2',
      [number_of_tickets, ticket_type_id]
    );

    await client.query('COMMIT');
    return bookingResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
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
  // Read-only pre-checks outside the transaction
  const result = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
  if (result.rows.length === 0) throw new Error('Booking not found');

  const booking = result.rows[0];
  if (booking.attendee_id !== userId) throw new Error('Not authorized to cancel this booking');
  if (booking.booking_status === 'CANCELLED') throw new Error('Booking already cancelled');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      "UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = $1",
      [bookingId]
    );
    await client.query(
      'UPDATE ticket_types SET available = available + $1 WHERE id = $2',
      [booking.number_of_tickets, booking.ticket_type_id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
