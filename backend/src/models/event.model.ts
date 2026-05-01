export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';

export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  price: number;
  quantity: number;
  available: number;
}

export interface Event {
  id: number;
  title: string;
  event_type?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  geo_lat?: number;
  geo_lng?: number;
  start_datetime: Date;
  end_datetime: Date;
  capacity: number;
  organizer_id: number;
  status: EventStatus;
  description?: string;
  created_at: Date;
  categories?: string[];
  photos?: string[];
  ticket_types?: TicketType[];
  organizer_username?: string;
  organizer_first_name?: string;
  organizer_last_name?: string;
}

export interface CreateEventDTO {
  title: string;
  event_type?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  geo_lat?: number;
  geo_lng?: number;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  description?: string;
  categories?: string[];
  photos?: string[];
  ticket_types?: Omit<TicketType, 'id' | 'event_id'>[];
}

export interface EventFilters {
  category?: string;
  title?: string;
  description?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  status?: EventStatus;
  organizerId?: number;
  page?: number;
  limit?: number;
}
