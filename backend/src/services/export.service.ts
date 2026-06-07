import prisma from '../config/prisma';
import { eventsToXml, EventExport, BookingExport } from '../utils/xml.utils';

const fetchAllEventsWithDetails = async (): Promise<EventExport[]> => {
  const events = await prisma.event.findMany({
    orderBy: { start_datetime: 'asc' },
    include: {
      organizer: { select: { username: true } },
      categories: true,
      photos: true,
      ticket_types: true,
      bookings: {
        select: {
          id: true, event_id: true, attendee_id: true, booked_at: true,
          ticket_type_id: true, number_of_tickets: true, total_cost: true, booking_status: true,
        },
      },
    },
  });

  return events.map((e) => ({
    ...e,
    organizer_username: e.organizer.username,
    categories: e.categories.map((c) => c.category),
    photos: e.photos.map((p) => p.photo_url),
    ticket_types: e.ticket_types,
    bookings: e.bookings as unknown as BookingExport[],
  })) as unknown as EventExport[];
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
