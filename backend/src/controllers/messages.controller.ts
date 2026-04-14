import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as messageService from '../services/message.service';

const PAGE_LIMIT = 10;

export const getInbox = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const page = Math.max(1, parseInt(req.query['page'] as string, 10) || 1);
		const result = await messageService.getInbox(req.user!.id, page, PAGE_LIMIT);
		res.json(result);
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
};

export const getSent = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const page = Math.max(1, parseInt(req.query['page'] as string, 10) || 1);
		const result = await messageService.getSent(req.user!.id, page, PAGE_LIMIT);
		res.json(result);
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const message = await messageService.sendMessage(req.user!.id, req.body);
		res.status(201).json(message);
	} catch (err: any) {
		res.status(400).json({ message: err.message });
	}
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		await messageService.deleteMessage(parseInt(req.params.id, 10), req.user!.id);
		res.json({ message: 'Message deleted' });
	} catch (err: any) {
		res.status(400).json({ message: err.message });
	}
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		await messageService.markAsRead(parseInt(req.params.id, 10), req.user!.id);
		res.json({ message: 'Marked as read' });
	} catch (err: any) {
		res.status(400).json({ message: err.message });
	}
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const count = await messageService.getUnreadCount(req.user!.id);
		res.json({ count });
	} catch (err: any) {
		res.status(500).json({ message: err.message });
	}
};
