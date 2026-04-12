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
	start_datetime: string;
	end_datetime: string;
	capacity: number;
	organizer_id: number;
	status: EventStatus;
	description?: string;
	created_at?: string;
	categories?: string[];
	photos?: string[];
	ticket_types?: TicketType[];
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
	page?: number;
	limit?: number;
}

export interface EventsResponse {
	events: Event[];
	total: number;
}

export interface CreateEventRequest {
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
