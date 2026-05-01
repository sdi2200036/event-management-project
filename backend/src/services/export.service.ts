import { query } from '../config/database';
import { eventsToXml, EventExport, BookingExport } from '../utils/xml.utils';

const fetchAllEventsWithDetails = async (): Promise<EventExport[]> => {
  // Fetch events with organizer username
  const result = await query(
    `SELECT e.*, u.username AS organizer_username
     FROM events e
     JOIN users u ON u.id = e.organizer_id
     ORDER BY e.start_datetime ASC`
  );
  const events: EventExport[] = result.rows;

  if (events.length === 0) return events;

  const eventIds = events.map(e => e.id);

  // Fetch all categories, photos, ticket_types, bookings in bulk (avoid N+1)
  const [cats, phs, tts, bks] = await Promise.all([
    query(
      `SELECT event_id, category FROM event_categories WHERE event_id = ANY($1)`,
      [eventIds]
    ),
    query(
      `SELECT event_id, photo_url FROM event_photos WHERE event_id = ANY($1)`,
      [eventIds]
    ),
    query(
      `SELECT * FROM ticket_types WHERE event_id = ANY($1)`,
      [eventIds]
    ),
    query(
      `SELECT id, event_id, attendee_id, booked_at, ticket_type_id,
              number_of_tickets, total_cost, booking_status
       FROM bookings WHERE event_id = ANY($1)`,
      [eventIds]
    ),
  ]);

  // Group results by event_id
  const categoriesByEvent = new Map<number, string[]>();
  for (const row of cats.rows) {
    const arr = categoriesByEvent.get(row.event_id) ?? [];
    arr.push(row.category);
    categoriesByEvent.set(row.event_id, arr);
  }

  const photosByEvent = new Map<number, string[]>();
  for (const row of phs.rows) {
    const arr = photosByEvent.get(row.event_id) ?? [];
    arr.push(row.photo_url);
    photosByEvent.set(row.event_id, arr);
  }

  const ticketsByEvent = new Map<number, any[]>();
  for (const row of tts.rows) {
    const arr = ticketsByEvent.get(row.event_id) ?? [];
    arr.push(row);
    ticketsByEvent.set(row.event_id, arr);
  }

  const bookingsByEvent = new Map<number, BookingExport[]>();
  for (const row of bks.rows) {
    const arr = bookingsByEvent.get(row.event_id) ?? [];
    arr.push(row);
    bookingsByEvent.set(row.event_id, arr);
  }

  // Attach to events
  for (const ev of events) {
    ev.categories = categoriesByEvent.get(ev.id) ?? [];
    ev.photos = photosByEvent.get(ev.id) ?? [];
    ev.ticket_types = ticketsByEvent.get(ev.id) ?? [];
    ev.bookings = bookingsByEvent.get(ev.id) ?? [];
  }

  return events;
};

export const exportEventsXML = async (): Promise<string> => {
  const events = await fetchAllEventsWithDetails();
  return eventsToXml(events);
};

export const exportEventsJSON = async (): Promise<object> => {
  const events = await fetchAllEventsWithDetails();
  return {
    exported_at: new Date().toISOString(),
    total: events.length,
    events,
  };
};
