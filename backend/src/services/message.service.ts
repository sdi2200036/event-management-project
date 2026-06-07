import prisma from '../config/prisma';
import {
  Message,
  MessageWithUsers,
  PaginatedInboxResponse,
  PaginatedSentResponse,
  SendMessageDTO,
} from '../models/message.model';

const userSelect = { username: true, first_name: true, last_name: true };

function mapMessage(m: any): MessageWithUsers {
  const { sender, receiver, ...rest } = m;
  return {
    ...rest,
    sender_username: sender?.username,
    sender_first_name: sender?.first_name,
    sender_last_name: sender?.last_name,
    receiver_username: receiver?.username,
    receiver_first_name: receiver?.first_name,
    receiver_last_name: receiver?.last_name,
  };
}

export const sendMessage = async (senderId: number, dto: SendMessageDTO): Promise<Message> => {
  const { receiver_username, booking_id, subject, body } = dto;

  const receiver = await prisma.user.findUnique({ where: { username: receiver_username }, select: { id: true } });
  if (!receiver) throw new Error('Receiver not found');
  if (receiver.id === senderId) throw new Error('You cannot send a message to yourself');

  const message = await prisma.message.create({
    data: {
      sender_id: senderId,
      receiver_id: receiver.id,
      booking_id: booking_id ?? null,
      subject,
      body,
    },
  });

  return message as unknown as Message;
};

export const getInbox = async (userId: number, page: number, limit: number): Promise<PaginatedInboxResponse> => {
  const offset = (page - 1) * limit;
  const where = { receiver_id: userId, deleted_by_receiver: false };

  const [total, unread_count, rows] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.count({ where: { receiver_id: userId, is_read: false, deleted_by_receiver: false } }),
    prisma.message.findMany({
      where,
      include: { sender: { select: userSelect }, receiver: { select: userSelect } },
      orderBy: [{ is_read: 'asc' }, { sent_at: 'desc' }],
      skip: offset,
      take: limit,
    }),
  ]);

  return { messages: rows.map(mapMessage), total, unread_count };
};

export const getSent = async (userId: number, page: number, limit: number): Promise<PaginatedSentResponse> => {
  const offset = (page - 1) * limit;
  const where = { sender_id: userId, deleted_by_sender: false };

  const [total, rows] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findMany({
      where,
      include: { sender: { select: userSelect }, receiver: { select: userSelect } },
      orderBy: { sent_at: 'desc' },
      skip: offset,
      take: limit,
    }),
  ]);

  return { messages: rows.map(mapMessage), total };
};

export const markAsRead = async (messageId: number, userId: number): Promise<void> => {
  const result = await prisma.message.updateMany({
    where: { id: messageId, receiver_id: userId },
    data: { is_read: true },
  });
  if (result.count === 0) throw new Error('Message not found or not authorized');
};

export const deleteMessage = async (messageId: number, userId: number): Promise<void> => {
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error('Message not found');

  if (msg.sender_id === userId) {
    await prisma.message.update({ where: { id: messageId }, data: { deleted_by_sender: true } });
  } else if (msg.receiver_id === userId) {
    await prisma.message.update({ where: { id: messageId }, data: { deleted_by_receiver: true } });
  } else {
    throw new Error('Not authorized to delete this message');
  }

  const updated = await prisma.message.findUnique({ where: { id: messageId } });
  if (updated?.deleted_by_sender && updated?.deleted_by_receiver) {
    await prisma.message.delete({ where: { id: messageId } });
  }
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  return prisma.message.count({
    where: { receiver_id: userId, is_read: false, deleted_by_receiver: false },
  });
};

export const notifyEventCancellation = async (eventId: number): Promise<void> => {
  const bookings = await prisma.booking.findMany({
    where: { event_id: eventId, booking_status: 'CONFIRMED' },
    include: {
      attendee: { select: { first_name: true, last_name: true } },
      event: { select: { title: true, organizer_id: true } },
    },
  });

  if (bookings.length === 0) return;

  // Group by ticket_type_id and restore available counts
  const restoreMap = new Map<number, number>();
  for (const b of bookings) {
    restoreMap.set(b.ticket_type_id, (restoreMap.get(b.ticket_type_id) ?? 0) + b.number_of_tickets);
  }

  await prisma.$transaction([
    ...Array.from(restoreMap.entries()).map(([ttId, qty]) =>
      prisma.ticketType.update({ where: { id: ttId }, data: { available: { increment: qty } } })
    ),
    prisma.booking.updateMany({
      where: { event_id: eventId, booking_status: 'CONFIRMED' },
      data: { booking_status: 'CANCELLED' },
    }),
  ]);

  // Send notification messages after the transaction commits
  for (const b of bookings) {
    await prisma.message.create({
      data: {
        sender_id: b.event.organizer_id,
        receiver_id: b.attendee_id,
        booking_id: b.id,
        subject: 'Event Cancellation Notice',
        body: `Dear ${b.attendee.first_name} ${b.attendee.last_name},\n\nWe regret to inform you that the event "${b.event.title}" has been cancelled.\nYour booking has been cancelled and a refund will be processed.\n\nWe apologize for any inconvenience.`,
      },
    });
  }
};
