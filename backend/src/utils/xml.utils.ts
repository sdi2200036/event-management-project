import { Event } from '../models/event.model';

/**
 * Escapes special XML characters in a string value.
 */
const escapeXml = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Converts an array of events to XML string following the assignment DTD structure.
 *
 * DTD structure:
 * <!ELEMENT events (event*)>
 * <!ELEMENT event (title, type, venue, location, datetime, capacity, organizer_id, status, description?, categories?, ticket_types?, photos?)>
 */
export const eventsToXml = (events: Event[]): string => {
  const eventNodes = events.map((e) => {
    const categories = e.categories && e.categories.length > 0
      ? `<categories>${e.categories.map(c => `<category>${escapeXml(c)}</category>`).join('')}</categories>`
      : '';

    const ticketTypes = e.ticket_types && e.ticket_types.length > 0
      ? `<ticket_types>${e.ticket_types.map(t =>
          `<ticket_type>
            <name>${escapeXml(t.name)}</name>
            <price>${t.price}</price>
            <quantity>${t.quantity}</quantity>
            <available>${t.available}</available>
          </ticket_type>`
        ).join('')}</ticket_types>`
      : '';

    const photos = e.photos && e.photos.length > 0
      ? `<photos>${e.photos.map(p => `<photo>${escapeXml(p)}</photo>`).join('')}</photos>`
      : '';

    return `  <event id="${e.id}">
    <title>${escapeXml(e.title)}</title>
    <type>${escapeXml(e.event_type)}</type>
    <venue>${escapeXml(e.venue)}</venue>
    <location>
      <address>${escapeXml(e.address)}</address>
      <city>${escapeXml(e.city)}</city>
      <country>${escapeXml(e.country)}</country>
      <geo_lat>${e.geo_lat ?? ''}</geo_lat>
      <geo_lng>${e.geo_lng ?? ''}</geo_lng>
    </location>
    <datetime>
      <start>${e.start_datetime ? new Date(e.start_datetime).toISOString() : ''}</start>
      <end>${e.end_datetime ? new Date(e.end_datetime).toISOString() : ''}</end>
    </datetime>
    <capacity>${e.capacity}</capacity>
    <organizer_id>${e.organizer_id}</organizer_id>
    <status>${escapeXml(e.status)}</status>
    <description>${escapeXml(e.description)}</description>
    ${categories}
    ${ticketTypes}
    ${photos}
  </event>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE events [
  <!ELEMENT events (event*)>
  <!ELEMENT event (title, type, venue, location, datetime, capacity, organizer_id, status, description?, categories?, ticket_types?, photos?)>
  <!ATTLIST event id CDATA #REQUIRED>
  <!ELEMENT title (#PCDATA)>
  <!ELEMENT type (#PCDATA)>
  <!ELEMENT venue (#PCDATA)>
  <!ELEMENT location (address, city, country, geo_lat, geo_lng)>
  <!ELEMENT address (#PCDATA)>
  <!ELEMENT city (#PCDATA)>
  <!ELEMENT country (#PCDATA)>
  <!ELEMENT geo_lat (#PCDATA)>
  <!ELEMENT geo_lng (#PCDATA)>
  <!ELEMENT datetime (start, end)>
  <!ELEMENT start (#PCDATA)>
  <!ELEMENT end (#PCDATA)>
  <!ELEMENT capacity (#PCDATA)>
  <!ELEMENT organizer_id (#PCDATA)>
  <!ELEMENT status (#PCDATA)>
  <!ELEMENT description (#PCDATA)>
  <!ELEMENT categories (category*)>
  <!ELEMENT category (#PCDATA)>
  <!ELEMENT ticket_types (ticket_type*)>
  <!ELEMENT ticket_type (name, price, quantity, available)>
  <!ELEMENT name (#PCDATA)>
  <!ELEMENT price (#PCDATA)>
  <!ELEMENT quantity (#PCDATA)>
  <!ELEMENT available (#PCDATA)>
  <!ELEMENT photos (photo*)>
  <!ELEMENT photo (#PCDATA)>
]>
<events>
${eventNodes}
</events>`;
};
