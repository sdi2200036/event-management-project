import { query } from '../config/database';
import { Event, CreateEventDTO, EventFilters } from '../models/event.model';

export const createEvent = async (organizerId: number, dto: CreateEventDTO): Promise<Event> => {
  const {
    title, event_type, venue, address, city, country,
    geo_lat, geo_lng, start_datetime, end_datetime, capacity, description,
    categories, photos, ticket_types,
  } = dto;

  if (capacity <= 0) {
    throw new Error('Capacity must be greater than 0');
  }

  if (new Date(end_datetime) <= new Date(start_datetime)) {
    throw new Error('End date/time must be after start date/time');
  }

  if (ticket_types && ticket_types.length > 0) {
    for (const tt of ticket_types) {
      if (tt.quantity <= 0) throw new Error(`Ticket type "${tt.name}": quantity must be greater than 0`);
      if (tt.price < 0) throw new Error(`Ticket type "${tt.name}": price cannot be negative`);
    }
    const totalTickets = ticket_types.reduce((sum, tt) => sum + tt.quantity, 0);
    if (totalTickets > capacity) {
      throw new Error(`Total ticket quantity (${totalTickets}) exceeds event capacity (${capacity})`);
    }
  }

  const result = await query(
    `INSERT INTO events (title, event_type, venue, address, city, country, geo_lat, geo_lng,
      start_datetime, end_datetime, capacity, organizer_id, status, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'DRAFT',$13) RETURNING *`,
    [title, event_type, venue, address, city, country, geo_lat, geo_lng,
     start_datetime, end_datetime, capacity, organizerId, description]
  );

  const event: Event = result.rows[0];

  if (categories && categories.length > 0) {
    for (const cat of categories) {
      await query('INSERT INTO event_categories (event_id, category) VALUES ($1,$2)', [event.id, cat]);
    }
    event.categories = categories;
  }

  if (photos && photos.length > 0) {
    for (const url of photos) {
      await query('INSERT INTO event_photos (event_id, photo_url) VALUES ($1,$2)', [event.id, url]);
    }
    event.photos = photos;
  }

  if (ticket_types && ticket_types.length > 0) {
    const tts = [];
    for (const tt of ticket_types) {
      const ttResult = await query(
        'INSERT INTO ticket_types (event_id, name, price, quantity, available) VALUES ($1,$2,$3,$4,$4) RETURNING *',
        [event.id, tt.name, tt.price, tt.quantity]
      );
      tts.push(ttResult.rows[0]);
    }
    event.ticket_types = tts;
  }

  return event;
};

export const getEvents = async (filters: EventFilters = {}): Promise<{ events: Event[]; total: number }> => {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  // Organizer searches see all their own statuses unless they filter by one.
  // Public searches default to PUBLISHED only.
  if (filters.organizerId) {
    conditions.push(`e.organizer_id = $${paramIdx++}`);
    params.push(filters.organizerId);
    if (filters.status) {
      conditions.push(`e.status = $${paramIdx++}`);
      params.push(filters.status);
    }
  } else if (!filters.status) {
    conditions.push(`e.status = 'PUBLISHED'`);
  } else {
    conditions.push(`e.status = $${paramIdx++}`);
    params.push(filters.status);
  }

  if (filters.title) {
    conditions.push(`e.title ILIKE $${paramIdx++}`);
    params.push(`%${filters.title}%`);
  }

  if (filters.description) {
    conditions.push(`e.description ILIKE $${paramIdx++}`);
    params.push(`%${filters.description}%`);
  }

  if (filters.dateFrom) {
    conditions.push(`e.start_datetime >= $${paramIdx++}`);
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push(`e.start_datetime <= $${paramIdx++}`);
    params.push(filters.dateTo);
  }

  if (filters.location) {
    conditions.push(`(e.city ILIKE $${paramIdx} OR e.country ILIKE $${paramIdx} OR e.address ILIKE $${paramIdx})`);
    params.push(`%${filters.location}%`);
    paramIdx++;
  }

  if (filters.category) {
    conditions.push(`EXISTS (SELECT 1 FROM event_categories ec WHERE ec.event_id = e.id AND ec.category ILIKE $${paramIdx++})`);
    params.push(`%${filters.category}%`);
  }

  if (filters.minPrice !== undefined) {
    conditions.push(`EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id AND tt.price >= $${paramIdx++})`);
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(`EXISTS (SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.id AND tt.price <= $${paramIdx++})`);
    params.push(filters.maxPrice);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM events e ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const eventsResult = await query(
    `SELECT e.* FROM events e ${whereClause} ORDER BY e.start_datetime ASC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  const events = eventsResult.rows;

  // Attach categories, photos, ticket_types
  for (const ev of events) {
    const cats = await query('SELECT category FROM event_categories WHERE event_id = $1', [ev.id]);
    ev.categories = cats.rows.map((r: any) => r.category);

    const phs = await query('SELECT photo_url FROM event_photos WHERE event_id = $1', [ev.id]);
    ev.photos = phs.rows.map((r: any) => r.photo_url);

    const tts = await query('SELECT * FROM ticket_types WHERE event_id = $1', [ev.id]);
    ev.ticket_types = tts.rows;
  }

  return { events, total };
};

export const getEventById = async (id: number): Promise<Event | null> => {
  const result = await query(
    `SELECT e.*, u.username AS organizer_username,
            u.first_name AS organizer_first_name, u.last_name AS organizer_last_name
     FROM events e
     JOIN users u ON u.id = e.organizer_id
     WHERE e.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;

  const event = result.rows[0];

  const cats = await query('SELECT category FROM event_categories WHERE event_id = $1', [id]);
  event.categories = cats.rows.map((r: any) => r.category);

  const phs = await query('SELECT photo_url FROM event_photos WHERE event_id = $1', [id]);
  event.photos = phs.rows.map((r: any) => r.photo_url);

  const tts = await query('SELECT * FROM ticket_types WHERE event_id = $1', [id]);
  event.ticket_types = tts.rows;

  return event;
};

export const updateEvent = async (id: number, organizerId: number, dto: Partial<CreateEventDTO>): Promise<Event> => {
  const event = await getEventById(id);
  if (!event) throw new Error('Event not found');
  if (event.organizer_id !== organizerId) throw new Error('Not authorized to edit this event');
  if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
    throw new Error('Cannot edit a cancelled or completed event');
  }

  const {
    title, event_type, venue, address, city, country,
    geo_lat, geo_lng, start_datetime, end_datetime, capacity, description, photos,
  } = dto;

  if (start_datetime && end_datetime && new Date(end_datetime) <= new Date(start_datetime)) {
    throw new Error('End date/time must be after start date/time');
  }

  if (capacity !== undefined) {
    if (capacity <= 0) throw new Error('Capacity must be greater than 0');
    const ttSum = await query(
      'SELECT COALESCE(SUM(quantity), 0) AS total FROM ticket_types WHERE event_id = $1',
      [id]
    );
    const currentTotal = parseInt(ttSum.rows[0].total, 10);
    if (currentTotal > capacity) {
      throw new Error(
        `Cannot reduce capacity to ${capacity} — existing ticket types total ${currentTotal} tickets`
      );
    }
  }

  await query(
    `UPDATE events SET
      title = COALESCE($1, title),
      event_type = COALESCE($2, event_type),
      venue = COALESCE($3, venue),
      address = COALESCE($4, address),
      city = COALESCE($5, city),
      country = COALESCE($6, country),
      geo_lat = COALESCE($7, geo_lat),
      geo_lng = COALESCE($8, geo_lng),
      start_datetime = COALESCE($9, start_datetime),
      end_datetime = COALESCE($10, end_datetime),
      capacity = COALESCE($11, capacity),
      description = COALESCE($12, description)
     WHERE id = $13`,
    [title, event_type, venue, address, city, country, geo_lat, geo_lng,
     start_datetime, end_datetime, capacity, description, id]
  );

  // Replace photos if provided
  if (photos !== undefined) {
    await query('DELETE FROM event_photos WHERE event_id = $1', [id]);
    for (const url of photos) {
      await query('INSERT INTO event_photos (event_id, photo_url) VALUES ($1,$2)', [id, url]);
    }
  }

  return (await getEventById(id))!;
};

export const publishEvent = async (id: number, organizerId: number): Promise<Event> => {
  const event = await getEventById(id);
  if (!event) throw new Error('Event not found');
  if (event.organizer_id !== organizerId) throw new Error('Not authorized');
  if (event.status !== 'DRAFT') throw new Error('Only DRAFT events can be published');

  const result = await query(
    "UPDATE events SET status = 'PUBLISHED' WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

export const cancelEvent = async (id: number, userId: number, userRole: string): Promise<Event> => {
  const event = await getEventById(id);
  if (!event) throw new Error('Event not found');
  if (userRole !== 'admin' && event.organizer_id !== userId) throw new Error('Not authorized');
  if (event.status === 'CANCELLED') throw new Error('Event is already cancelled');

  const result = await query(
    "UPDATE events SET status = 'CANCELLED' WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

export const deleteEvent = async (id: number, userId: number, userRole: string): Promise<void> => {
  const event = await getEventById(id);
  if (!event) throw new Error('Event not found');
  if (userRole !== 'admin' && event.organizer_id !== userId) throw new Error('Not authorized');
  if (event.status === 'PUBLISHED') throw new Error('Cannot delete a published event. Cancel it first.');

  await query('DELETE FROM events WHERE id = $1', [id]);
};

export const trackView = async (userId: number, eventId: number): Promise<void> => {
  await query(
    `INSERT INTO event_views (user_id, event_id) VALUES ($1, $2)
     ON CONFLICT (user_id, event_id) DO UPDATE SET viewed_at = NOW()`,
    [userId, eventId]
  );
};
