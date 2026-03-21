import { query } from '../config/database';
import { eventsToXml } from '../utils/xml.utils';
import { Event } from '../models/event.model';

const fetchAllEventsWithDetails = async (): Promise<Event[]> => {
  const result = await query('SELECT * FROM events ORDER BY start_datetime ASC');
  const events: Event[] = result.rows;

  for (const ev of events) {
    const cats = await query('SELECT category FROM event_categories WHERE event_id = $1', [ev.id]);
    ev.categories = cats.rows.map((r: any) => r.category);

    const phs = await query('SELECT photo_url FROM event_photos WHERE event_id = $1', [ev.id]);
    ev.photos = phs.rows.map((r: any) => r.photo_url);

    const tts = await query('SELECT * FROM ticket_types WHERE event_id = $1', [ev.id]);
    ev.ticket_types = tts.rows;
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
