export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  price: number;
  quantity: number;
  available: number;
}

export interface CreateTicketTypeDTO {
  event_id: number;
  name: string;
  price: number;
  quantity: number;
}
