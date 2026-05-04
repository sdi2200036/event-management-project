import pool, { query } from '../config/database';
import {
	Message,
	MessageWithUsers,
	PaginatedInboxResponse,
	PaginatedSentResponse,
	SendMessageDTO
} from '../models/message.model';

export const sendMessage = async (senderId: number, dto: SendMessageDTO): Promise<Message> => {
	const { receiver_username, booking_id, subject, body } = dto;

	// Verify receiver exists by username
	const receiver = await query('SELECT id FROM users WHERE username = $1', [receiver_username]);
	if (receiver.rows.length === 0) throw new Error('Receiver not found');

	const receiver_id = receiver.rows[0].id;

	if (receiver_id === senderId) throw new Error('You cannot send a message to yourself');

	const result = await query(
		`INSERT INTO messages (sender_id, receiver_id, booking_id, subject, body)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
		[senderId, receiver_id, booking_id || null, subject, body]
	);
	return result.rows[0];
};

export const getInbox = async (userId: number, page: number, limit: number): Promise<PaginatedInboxResponse> => {
	const offset = (page - 1) * limit;
	const result = await query(
		`SELECT m.*,
            s.username as sender_username, s.first_name as sender_first_name, s.last_name as sender_last_name,
            r.username as receiver_username, r.first_name as receiver_first_name, r.last_name as receiver_last_name,
            COUNT(*) OVER() AS total_count,
            (SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE AND deleted_by_receiver = FALSE) AS unread_count
     FROM messages m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.receiver_id
     WHERE m.receiver_id = $1 AND m.deleted_by_receiver = FALSE
     ORDER BY m.is_read ASC, m.sent_at DESC
     LIMIT $2 OFFSET $3`,
		[userId, limit, offset]
	);

	const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
	const unread_count = result.rows.length > 0 ? parseInt(result.rows[0].unread_count, 10) : 0;
	const messages: MessageWithUsers[] = result.rows.map(({ total_count: _t, unread_count: _u, ...msg }) => msg);

	return { messages, total, unread_count };
};

export const getSent = async (userId: number, page: number, limit: number): Promise<PaginatedSentResponse> => {
	const offset = (page - 1) * limit;
	const result = await query(
		`SELECT m.*,
            s.username as sender_username, s.first_name as sender_first_name, s.last_name as sender_last_name,
            r.username as receiver_username, r.first_name as receiver_first_name, r.last_name as receiver_last_name,
            COUNT(*) OVER() AS total_count
     FROM messages m
     JOIN users s ON s.id = m.sender_id
     JOIN users r ON r.id = m.receiver_id
     WHERE m.sender_id = $1 AND m.deleted_by_sender = FALSE
     ORDER BY m.sent_at DESC
     LIMIT $2 OFFSET $3`,
		[userId, limit, offset]
	);

	const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
	const messages: MessageWithUsers[] = result.rows.map(({ total_count: _t, ...msg }) => msg);

	return { messages, total };
};

export const markAsRead = async (messageId: number, userId: number): Promise<void> => {
	const result = await query('UPDATE messages SET is_read = TRUE WHERE id = $1 AND receiver_id = $2 RETURNING id', [
		messageId,
		userId
	]);
	if (result.rows.length === 0) throw new Error('Message not found or not authorized');
};

export const deleteMessage = async (messageId: number, userId: number): Promise<void> => {
	const result = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
	if (result.rows.length === 0) throw new Error('Message not found');

	const msg = result.rows[0];
	if (msg.sender_id === userId) {
		await query('UPDATE messages SET deleted_by_sender = TRUE WHERE id = $1', [messageId]);
	} else if (msg.receiver_id === userId) {
		await query('UPDATE messages SET deleted_by_receiver = TRUE WHERE id = $1', [messageId]);
	} else {
		throw new Error('Not authorized to delete this message');
	}

	// If both sides deleted, hard-delete the record
	const updated = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
	if (updated.rows[0].deleted_by_sender && updated.rows[0].deleted_by_receiver) {
		await query('DELETE FROM messages WHERE id = $1', [messageId]);
	}
};

export const getUnreadCount = async (userId: number): Promise<number> => {
	const result = await query(
		'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE AND deleted_by_receiver = FALSE',
		[userId]
	);
	return parseInt(result.rows[0].count, 10);
};

export const notifyEventCancellation = async (eventId: number): Promise<void> => {
	// Fetch confirmed bookings with all info needed for messages
	const bookings = await query(
		`SELECT b.id as booking_id, b.attendee_id, b.ticket_type_id, b.number_of_tickets,
		        e.title as event_title, e.organizer_id,
		        u.first_name, u.last_name
		 FROM bookings b
		 JOIN events e ON e.id = b.event_id
		 JOIN users u ON u.id = b.attendee_id
		 WHERE b.event_id = $1 AND b.booking_status = 'CONFIRMED'`,
		[eventId]
	);

	if (bookings.rows.length === 0) return;

	// Atomically cancel bookings and restore ticket availability
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Restore available count per ticket type in one query
		await client.query(
			`UPDATE ticket_types tt
			 SET available = tt.available + b.total
			 FROM (
			   SELECT ticket_type_id, SUM(number_of_tickets) AS total
			   FROM bookings
			   WHERE event_id = $1 AND booking_status = 'CONFIRMED'
			   GROUP BY ticket_type_id
			 ) b
			 WHERE tt.id = b.ticket_type_id`,
			[eventId]
		);

		await client.query(
			`UPDATE bookings SET booking_status = 'CANCELLED'
			 WHERE event_id = $1 AND booking_status = 'CONFIRMED'`,
			[eventId]
		);

		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}

	// Send notification messages after the transaction commits
	for (const row of bookings.rows) {
		await query(
			`INSERT INTO messages (sender_id, receiver_id, booking_id, subject, body)
			 VALUES ($1,$2,$3,$4,$5)`,
			[
				row.organizer_id,
				row.attendee_id,
				row.booking_id,
				'Event Cancellation Notice',
				`Dear ${row.first_name} ${row.last_name},\n\nWe regret to inform you that the event "${row.event_title}" has been cancelled.\nYour booking has been cancelled and a refund will be processed.\n\nWe apologize for any inconvenience.`
			]
		);
	}
};
