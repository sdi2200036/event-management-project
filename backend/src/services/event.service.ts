import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { CreateEventDTO, Event, EventFilters } from '../models/event.model';

// Shape the Prisma event record into the flat Event model the rest of the app expects
function mapEvent(raw: any): Event {
	const { categories, photos, ticket_types, organizer, ...rest } = raw;
	return {
		...rest,
		categories: categories?.map((c: any) => c.category) ?? undefined,
		photos: photos?.map((p: any) => p.photo_url) ?? undefined,
		ticket_types: ticket_types ?? undefined,
		organizer_username: organizer?.username,
		organizer_first_name: organizer?.first_name,
		organizer_last_name: organizer?.last_name
	};
}

const eventInclude = {
	categories: true,
	photos: true,
	ticket_types: true
} satisfies Prisma.EventInclude;

const eventIncludeWithOrganizer = {
	...eventInclude,
	organizer: { select: { username: true, first_name: true, last_name: true } }
} satisfies Prisma.EventInclude;

export const createEvent = async (organizerId: number, dto: CreateEventDTO): Promise<Event> => {
	const {
		title,
		event_type,
		venue,
		address,
		city,
		country,
		geo_lat,
		geo_lng,
		start_datetime,
		end_datetime,
		capacity,
		description,
		categories,
		photos,
		ticket_types
	} = dto;

	if (!categories || categories.length === 0) throw new Error('At least one category is required');
	if (!ticket_types || ticket_types.length === 0) throw new Error('At least one ticket type is required');
	if (capacity <= 0) throw new Error('Capacity must be greater than 0');
	if (new Date(end_datetime) <= new Date(start_datetime))
		throw new Error('End date/time must be after start date/time');

	for (const tt of ticket_types) {
		if (tt.quantity <= 0) throw new Error(`Ticket type "${tt.name}": quantity must be greater than 0`);
		if (tt.price < 0) throw new Error(`Ticket type "${tt.name}": price cannot be negative`);
	}
	const totalTickets = ticket_types.reduce((sum, tt) => sum + tt.quantity, 0);
	if (totalTickets > capacity)
		throw new Error(`Total ticket quantity (${totalTickets}) exceeds event capacity (${capacity})`);

	const event = await prisma.event.create({
		data: {
			title,
			event_type,
			venue,
			address,
			city,
			country,
			geo_lat,
			geo_lng,
			start_datetime: new Date(start_datetime),
			end_datetime: new Date(end_datetime),
			capacity,
			description,
			organizer_id: organizerId,
			status: 'DRAFT',
			categories: { create: categories.map((cat) => ({ category: cat })) },
			photos: photos?.length ? { create: photos.map((url) => ({ photo_url: url })) } : undefined,
			ticket_types: {
				create: ticket_types.map((tt) => ({
					name: tt.name,
					price: tt.price,
					quantity: tt.quantity,
					available: tt.quantity
				}))
			}
		},
		include: eventInclude
	});

	return mapEvent(event);
};

export const getEvents = async (filters: EventFilters = {}): Promise<{ events: Event[]; total: number }> => {
	const where: Prisma.EventWhereInput = {};

	if (filters.organizerId) {
		where.organizer_id = filters.organizerId;
		if (filters.status) where.status = filters.status as any;
	} else if (!filters.status) {
		where.status = 'PUBLISHED';
	} else {
		where.status = filters.status as any;
	}

	if (filters.title) where.title = { contains: filters.title, mode: 'insensitive' };
	if (filters.description) where.description = { contains: filters.description, mode: 'insensitive' };

	if (filters.dateFrom || filters.dateTo) {
		where.start_datetime = {
			...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
			...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {})
		};
	}

	if (filters.location) {
		where.OR = [
			{ city: { contains: filters.location, mode: 'insensitive' } },
			{ country: { contains: filters.location, mode: 'insensitive' } },
			{ address: { contains: filters.location, mode: 'insensitive' } }
		];
	}

	if (filters.category) {
		where.categories = { some: { category: { contains: filters.category, mode: 'insensitive' } } };
	}

	if (filters.minPrice !== undefined) {
		where.ticket_types = { some: { price: { gte: filters.minPrice } } };
	}
	if (filters.maxPrice !== undefined) {
		where.ticket_types = {
			...(where.ticket_types as any),
			some: { price: { lte: filters.maxPrice } }
		};
	}

	const page = filters.page || 1;
	const limit = filters.limit || 20;
	const offset = (page - 1) * limit;

	const [total, rows] = await Promise.all([
		prisma.event.count({ where }),
		prisma.event.findMany({
			where,
			include: eventInclude,
			orderBy: { start_datetime: 'asc' },
			skip: offset,
			take: limit
		})
	]);

	return { events: rows.map(mapEvent), total };
};

export const getEventById = async (id: number): Promise<Event | null> => {
	const event = await prisma.event.findUnique({
		where: { id },
		include: eventIncludeWithOrganizer
	});
	return event ? mapEvent(event) : null;
};

export const updateEvent = async (
	id: number,
	userId: number,
	userRole: string,
	dto: Partial<CreateEventDTO>
): Promise<Event> => {
	const event = await getEventById(id);
	if (!event) throw new Error('Event not found');
	if (userRole !== 'admin' && event.organizer_id !== userId) throw new Error('Not authorized to edit this event');
	if (event.status === 'CANCELLED' || event.status === 'COMPLETED')
		throw new Error('Cannot edit a cancelled or completed event');

	const {
		title,
		event_type,
		venue,
		address,
		city,
		country,
		geo_lat,
		geo_lng,
		start_datetime,
		end_datetime,
		capacity,
		description,
		photos,
		categories,
		ticket_types
	} = dto;

	if (start_datetime && end_datetime && new Date(end_datetime) <= new Date(start_datetime)) {
		throw new Error('End date/time must be after start date/time');
	}

	const effectiveCapacity = capacity ?? event.capacity;

	if (capacity !== undefined) {
		if (capacity <= 0) throw new Error('Capacity must be greater than 0');
		const agg = await prisma.ticketType.aggregate({ where: { event_id: id }, _sum: { quantity: true } });
		const currentTotal = agg._sum.quantity ?? 0;
		if (currentTotal > capacity) {
			throw new Error(
				`Cannot reduce capacity to ${capacity} - existing ticket types total ${currentTotal} tickets`
			);
		}
	}

	await prisma.event.update({
		where: { id },
		data: {
			...(title !== undefined ? { title } : {}),
			...(event_type !== undefined ? { event_type } : {}),
			...(venue !== undefined ? { venue } : {}),
			...(address !== undefined ? { address } : {}),
			...(city !== undefined ? { city } : {}),
			...(country !== undefined ? { country } : {}),
			geo_lat: geo_lat !== undefined ? geo_lat : event.geo_lat,
			geo_lng: geo_lng !== undefined ? geo_lng : event.geo_lng,
			...(start_datetime !== undefined ? { start_datetime: new Date(start_datetime) } : {}),
			...(end_datetime !== undefined ? { end_datetime: new Date(end_datetime) } : {}),
			...(capacity !== undefined ? { capacity } : {}),
			...(description !== undefined ? { description } : {})
		}
	});

	if (photos !== undefined) {
		await prisma.eventPhoto.deleteMany({ where: { event_id: id } });
		if (photos.length > 0) {
			await prisma.eventPhoto.createMany({ data: photos.map((url) => ({ event_id: id, photo_url: url })) });
		}
	}

	if (categories !== undefined) {
		await prisma.eventCategory.deleteMany({ where: { event_id: id } });
		if (categories.length > 0) {
			await prisma.eventCategory.createMany({ data: categories.map((cat) => ({ event_id: id, category: cat })) });
		}
	}

	if (ticket_types !== undefined && ticket_types.length > 0) {
		if (event.status === 'DRAFT') {
			await prisma.ticketType.deleteMany({ where: { event_id: id } });
			await prisma.ticketType.createMany({
				data: ticket_types.map((tt) => ({
					event_id: id,
					name: tt.name,
					price: tt.price,
					quantity: tt.quantity,
					available: tt.quantity
				}))
			});
		} else {
			const existingTTs = await prisma.ticketType.findMany({ where: { event_id: id } });
			for (const tt of ticket_types) {
				const existing = existingTTs.find((e: any) => e.name === tt.name);
				if (existing) {
					const sold = existing.quantity - existing.available;
					const newAvailable = Math.max(0, tt.quantity - sold);
					await prisma.ticketType.update({
						where: { id: existing.id },
						data: { price: tt.price, quantity: tt.quantity, available: newAvailable }
					});
				} else {
					await prisma.ticketType.create({
						data: {
							event_id: id,
							name: tt.name,
							price: tt.price,
							quantity: tt.quantity,
							available: tt.quantity
						}
					});
				}
			}
		}

		const agg = await prisma.ticketType.aggregate({ where: { event_id: id }, _sum: { quantity: true } });
		const newTotal = agg._sum.quantity ?? 0;
		if (newTotal > effectiveCapacity) {
			throw new Error(`Total ticket quantity (${newTotal}) exceeds event capacity (${effectiveCapacity})`);
		}
	}

	return (await getEventById(id))!;
};

export const publishEvent = async (id: number, organizerId: number): Promise<Event> => {
	const event = await getEventById(id);
	if (!event) throw new Error('Event not found');
	if (event.organizer_id !== organizerId) throw new Error('Not authorized');
	if (event.status !== 'DRAFT') throw new Error('Only DRAFT events can be published');

	const updated = await prisma.event.update({ where: { id }, data: { status: 'PUBLISHED' } });
	return updated as unknown as Event;
};

export const cancelEvent = async (id: number, userId: number, userRole: string): Promise<Event> => {
	const event = await getEventById(id);
	if (!event) throw new Error('Event not found');
	if (userRole !== 'admin' && event.organizer_id !== userId) throw new Error('Not authorized');
	if (event.status === 'CANCELLED') throw new Error('Event is already cancelled');

	const updated = await prisma.event.update({ where: { id }, data: { status: 'CANCELLED' } });
	return updated as unknown as Event;
};

export const deleteEvent = async (id: number, userId: number, userRole: string): Promise<void> => {
	const event = await getEventById(id);
	if (!event) throw new Error('Event not found');
	if (userRole !== 'admin' && event.organizer_id !== userId) throw new Error('Not authorized');

	if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
		throw new Error('Cannot delete a cancelled or completed event');
	}

	if (event.status === 'PUBLISHED') {
		const bookingCount = await prisma.booking.count({
			where: { event_id: id, booking_status: { not: 'CANCELLED' } }
		});
		if (bookingCount > 0)
			throw new Error('Cannot delete a published event with existing bookings. Cancel it first.');
	}

	await prisma.event.delete({ where: { id } });
};

export const trackView = async (userId: number, eventId: number): Promise<void> => {
	await prisma.eventView.upsert({
		where: { user_id_event_id: { user_id: userId, event_id: eventId } },
		update: { viewed_at: new Date() },
		create: { user_id: userId, event_id: eventId }
	});
};

export const completeExpiredEvents = async (): Promise<number> => {
	const result = await prisma.event.updateMany({
		where: { status: 'PUBLISHED', end_datetime: { lt: new Date() } },
		data: { status: 'COMPLETED' }
	});
	return result.count;
};
