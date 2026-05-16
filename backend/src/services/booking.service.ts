import prisma from '../config/prisma';
import { Booking, BookingWithDetails, CreateBookingDTO } from '../models/booking.model';

export const createBooking = async (attendeeId: number, dto: CreateBookingDTO): Promise<Booking> => {
  const { event_id, ticket_type_id, number_of_tickets } = dto;

  // Pre-checks outside the transaction (read-only)
  const event = await prisma.event.findFirst({ where: { id: event_id, status: 'PUBLISHED' }, select: { id: true } });
  if (!event) throw new Error('Event not found or not available for booking');

  const ttCheck = await prisma.ticketType.findFirst({ where: { id: ticket_type_id, event_id }, select: { id: true } });
  if (!ttCheck) throw new Error('Ticket type not found for this event');

  // Transaction with row-level locking to prevent concurrent overbooking
  const booking = await prisma.$transaction(async (tx) => {
    // Lock the ticket_type row
    const [ticketType] = await tx.$queryRaw<any[]>`
      SELECT * FROM ticket_types WHERE id = ${ticket_type_id} FOR UPDATE
    `;

    if (ticketType.available < number_of_tickets) {
      throw new Error(`Only ${ticketType.available} ticket(s) available`);
    }

    // Check total event capacity
    const capacityRow = await tx.$queryRaw<any[]>`
      SELECT e.capacity,
             COALESCE(SUM(b.number_of_tickets), 0) AS booked
      FROM events e
      LEFT JOIN bookings b ON b.event_id = e.id AND b.booking_status = 'CONFIRMED'
      WHERE e.id = ${event_id}
      GROUP BY e.capacity
    `;
    const { capacity, booked } = capacityRow[0];
    if (Number(booked) + number_of_tickets > Number(capacity)) {
      throw new Error('Not enough capacity remaining for this event');
    }

    const total_cost = Number(ticketType.price) * number_of_tickets;

    const newBooking = await tx.booking.create({
      data: {
        event_id,
        attendee_id: attendeeId,
        ticket_type_id,
        number_of_tickets,
        total_cost,
        booking_status: 'CONFIRMED',
      },
    });

    await tx.ticketType.update({
      where: { id: ticket_type_id },
      data: { available: { decrement: number_of_tickets } },
    });

    return newBooking;
  });

  return booking as unknown as Booking;
};

export const getBookingsByEvent = async (eventId: number): Promise<BookingWithDetails[]> => {
  const rows = await prisma.booking.findMany({
    where: { event_id: eventId },
    include: {
      attendee: { select: { username: true, email: true, first_name: true, last_name: true } },
      ticket_type: { select: { name: true, price: true } },
    },
    orderBy: { booked_at: 'desc' },
  });

  return rows.map((b) => ({
    ...b,
    attendee_username: b.attendee.username,
    attendee_email: b.attendee.email,
    first_name: b.attendee.first_name,
    last_name: b.attendee.last_name,
    ticket_type_name: b.ticket_type.name,
    ticket_type_price: b.ticket_type.price,
  })) as unknown as BookingWithDetails[];
};

export const getBookingsByUser = async (userId: number): Promise<BookingWithDetails[]> => {
  const rows = await prisma.booking.findMany({
    where: { attendee_id: userId },
    include: {
      event: { select: { title: true, start_datetime: true } },
      ticket_type: { select: { name: true, price: true } },
    },
    orderBy: { booked_at: 'desc' },
  });

  return rows.map((b) => ({
    ...b,
    event_title: b.event.title,
    event_start_datetime: b.event.start_datetime,
    ticket_type_name: b.ticket_type.name,
    ticket_type_price: b.ticket_type.price,
  })) as unknown as BookingWithDetails[];
};

export const cancelBooking = async (bookingId: number, userId: number): Promise<void> => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');
  if (booking.attendee_id !== userId) throw new Error('Not authorized to cancel this booking');
  if (booking.booking_status === 'CANCELLED') throw new Error('Booking already cancelled');

  await prisma.$transaction([
    prisma.booking.update({ where: { id: bookingId }, data: { booking_status: 'CANCELLED' } }),
    prisma.ticketType.update({
      where: { id: booking.ticket_type_id },
      data: { available: { increment: booking.number_of_tickets } },
    }),
  ]);
};
