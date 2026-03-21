export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: number;
  event_id: number;
  attendee_id: number;
  ticket_type_id: number;
  number_of_tickets: number;
  total_cost: number;
  booking_status: BookingStatus;
  booked_at: Date;
}

export interface BookingWithDetails extends Booking {
  event_title?: string;
  event_start_datetime?: Date;
  ticket_type_name?: string;
  ticket_type_price?: number;
  attendee_username?: string;
  attendee_email?: string;
}

export interface CreateBookingDTO {
  event_id: number;
  ticket_type_id: number;
  number_of_tickets: number;
}
