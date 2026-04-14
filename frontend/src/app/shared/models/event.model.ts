export enum EventStatus {
	DRAFT = 'DRAFT',
	PUBLISHED = 'PUBLISHED',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED'
}

export enum EventCategory {
	MUSIC = 'Music',
	SPORTS = 'Sports',
	ARTS = 'Arts',
	TECHNOLOGY = 'Technology',
	BUSINESS = 'Business',
	FOOD_AND_DRINK = 'Food & Drink',
	HEALTH = 'Health',
	COMMUNITY = 'Community',
	FILM = 'Film',
	FASHION = 'Fashion',
	EDUCATION = 'Education',
	OTHER = 'Other'
}

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
	categories?: EventCategory[];
	photos?: string[];
	ticket_types?: TicketType[];
	organizer_username?: string;
	organizer_first_name?: string;
	organizer_last_name?: string;
}

export interface EventFilters {
	category?: EventCategory;
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
}

export interface EventsResponseExtended extends EventsResponse {
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
	categories?: EventCategory[];
	photos?: string[];
	ticket_types?: Omit<TicketType, 'id' | 'event_id'>[];
}
