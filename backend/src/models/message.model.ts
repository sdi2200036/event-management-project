export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  booking_id?: number;
  subject: string;
  body: string;
  is_read: boolean;
  sent_at: Date;
  deleted_by_sender: boolean;
  deleted_by_receiver: boolean;
}

export interface MessageWithUsers extends Message {
  sender_username?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  receiver_username?: string;
  receiver_first_name?: string;
  receiver_last_name?: string;
}

export interface SendMessageDTO {
  receiver_id: number;
  booking_id?: number;
  subject: string;
  body: string;
}
