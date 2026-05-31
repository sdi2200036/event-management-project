import { Event } from '../models/event.model';

export interface BookingExport {
	id: number;
	attendee_id: number;
	booked_at: Date | string;
	ticket_type_id: number;
	number_of_tickets: number;
	total_cost: number;
	booking_status: string;
}

export interface EventExport extends Event {
	organizer_username?: string;
	bookings?: BookingExport[];
}

const escapeXml = (value: any): string => {
	if (value === null || value === undefined) return '';
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
};

export const eventsToXml = (events: EventExport[]): string => {
	const eventNodes = events
		.map((e) => {
			// Category+ - at least one required per DTD
			const categories =
				e.categories && e.categories.length > 0
					? e.categories.map((c) => `    <Category>${escapeXml(c)}</Category>`).join('\n')
					: '    <Category></Category>';

			// GeoLocation is optional (GeoLocation?)
			const geoLocation =
				e.geo_lat != null && e.geo_lng != null
					? `    <GeoLocation Latitude="${e.geo_lat}" Longitude="${e.geo_lng}"/>`
					: '';

			// TicketTypes with TicketTypeID attribute per DTD
			const ticketTypes =
				e.ticket_types && e.ticket_types.length > 0
					? [
							'    <TicketTypes>',
							...e.ticket_types.map(
								(t) =>
									`      <TicketType TicketTypeID="${t.id}">\n` +
									`        <Name>${escapeXml(t.name)}</Name>\n` +
									`        <Price>${t.price}</Price>\n` +
									`        <Quantity>${t.quantity}</Quantity>\n` +
									`        <Available>${t.available}</Available>\n` +
									`      </TicketType>`
							),
							'    </TicketTypes>'
						].join('\n')
					: '    <TicketTypes/>';

			// Bookings - required element per DTD (Booking*)
			const bookingNodes =
				e.bookings && e.bookings.length > 0
					? e.bookings
							.map(
								(b) =>
									`      <Booking BookingID="${b.id}">\n` +
									`        <Attendee UserID="${b.attendee_id}"/>\n` +
									`        <Time>${b.booked_at ? new Date(b.booked_at).toISOString() : ''}</Time>\n` +
									`        <TicketTypeRef>${b.ticket_type_id}</TicketTypeRef>\n` +
									`        <NumberOfTickets>${b.number_of_tickets}</NumberOfTickets>\n` +
									`        <TotalCost>${b.total_cost}</TotalCost>\n` +
									`        <BookingStatus>${escapeXml(b.booking_status)}</BookingStatus>\n` +
									`      </Booking>`
							)
							.join('\n')
					: '';
			const bookings = `    <Bookings>\n${bookingNodes}\n    </Bookings>`;

			// Media is optional (Media?)
			const media =
				e.photos && e.photos.length > 0
					? [
							'    <Media>',
							...e.photos.map((p) => `      <Photo>${escapeXml(p)}</Photo>`),
							'    </Media>'
						].join('\n')
					: '';

			const organizerUserId = escapeXml(e.organizer_username ?? String(e.organizer_id));

			return [
				`  <Event EventID="${e.id}">`,
				`    <Title>${escapeXml(e.title)}</Title>`,
				categories,
				`    <EventType>${escapeXml(e.event_type)}</EventType>`,
				`    <Venue>${escapeXml(e.venue)}</Venue>`,
				`    <Address>${escapeXml(e.address)}</Address>`,
				`    <City>${escapeXml(e.city)}</City>`,
				`    <Country>${escapeXml(e.country)}</Country>`,
				geoLocation,
				`    <StartDateTime>${e.start_datetime ? new Date(e.start_datetime).toISOString() : ''}</StartDateTime>`,
				`    <EndDateTime>${e.end_datetime ? new Date(e.end_datetime).toISOString() : ''}</EndDateTime>`,
				`    <Capacity>${e.capacity}</Capacity>`,
				ticketTypes,
				bookings,
				`    <Organizer UserID="${organizerUserId}"/>`,
				`    <Status>${escapeXml(e.status)}</Status>`,
				`    <Description>${escapeXml(e.description)}</Description>`,
				media,
				`  </Event>`
			]
				.filter((line) => line !== '')
				.join('\n');
		})
		.join('\n');

	const dtd = `<!DOCTYPE Events [
  <!ELEMENT Events (Event*)>
  <!ELEMENT Event (Title, Category+, EventType, Venue, Address, City, Country, GeoLocation?, StartDateTime, EndDateTime, Capacity, TicketTypes, Bookings, Organizer, Status, Description, Media?)>
  <!ATTLIST Event EventID CDATA #REQUIRED>
  <!ELEMENT Title (#PCDATA)>
  <!ELEMENT Category (#PCDATA)>
  <!ELEMENT EventType (#PCDATA)>
  <!ELEMENT Venue (#PCDATA)>
  <!ELEMENT Address (#PCDATA)>
  <!ELEMENT City (#PCDATA)>
  <!ELEMENT Country (#PCDATA)>
  <!ELEMENT GeoLocation EMPTY>
  <!ATTLIST GeoLocation Latitude CDATA #REQUIRED Longitude CDATA #REQUIRED>
  <!ELEMENT StartDateTime (#PCDATA)>
  <!ELEMENT EndDateTime (#PCDATA)>
  <!ELEMENT Capacity (#PCDATA)>
  <!ELEMENT TicketTypes (TicketType+)>
  <!ELEMENT TicketType (Name, Price, Quantity, Available)>
  <!ATTLIST TicketType TicketTypeID CDATA #REQUIRED>
  <!ELEMENT Name (#PCDATA)>
  <!ELEMENT Price (#PCDATA)>
  <!ELEMENT Quantity (#PCDATA)>
  <!ELEMENT Available (#PCDATA)>
  <!ELEMENT Bookings (Booking*)>
  <!ELEMENT Booking (Attendee, Time, TicketTypeRef, NumberOfTickets, TotalCost, BookingStatus)>
  <!ATTLIST Booking BookingID CDATA #REQUIRED>
  <!ELEMENT Attendee EMPTY>
  <!ATTLIST Attendee UserID CDATA #REQUIRED>
  <!ELEMENT Time (#PCDATA)>
  <!ELEMENT TicketTypeRef (#PCDATA)>
  <!ELEMENT NumberOfTickets (#PCDATA)>
  <!ELEMENT TotalCost (#PCDATA)>
  <!ELEMENT BookingStatus (#PCDATA)>
  <!ELEMENT Organizer EMPTY>
  <!ATTLIST Organizer UserID CDATA #REQUIRED>
  <!ELEMENT Status (#PCDATA)>
  <!ELEMENT Description (#PCDATA)>
  <!ELEMENT Media (Photo*)>
  <!ELEMENT Photo (#PCDATA)>
]>`;

	return `<?xml version="1.0" encoding="UTF-8"?>\n${dtd}\n<Events>\n${eventNodes}\n</Events>`;
};
