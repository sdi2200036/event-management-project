import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as eventService from '../services/event.service';
import { getRecommendationsForUser } from '../services/recommendation.service';
import { EventFilters } from '../models/event.model';

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: EventFilters = {
      category: req.query.category as string,
      title: req.query.title as string,
      description: req.query.description as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      location: req.query.location as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: Math.min(req.query.limit ? parseInt(req.query.limit as string, 10) : 20, 100),
    };

    const result = await eventService.getEvents(filters);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventService.getEventById(parseInt(req.params.id, 10));
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const authReq = req as AuthRequest;
    const user = authReq.user;

    // Non-published events are only visible to the organizer or an admin
    if (event.status !== 'PUBLISHED') {
      const canView = user && (user.role === 'admin' || user.id === event.organizer_id);
      if (!canView) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }
    }

    // Track views only for published events
    if (user && event.status === 'PUBLISHED') {
      await eventService.trackView(user.id, event.id);
    }

    res.json(event);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await eventService.createEvent(req.user!.id, req.body);
    res.status(201).json(event);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await eventService.updateEvent(parseInt(req.params.id, 10), req.user!.id, req.user!.role, req.body);
    res.json(event);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const publishEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await eventService.publishEvent(parseInt(req.params.id, 10), req.user!.id);
    res.json(event);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const cancelEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await eventService.cancelEvent(parseInt(req.params.id, 10), req.user!.id, req.user!.role);

    // Notify attendees about cancellation
    const { notifyEventCancellation } = await import('../services/message.service');
    await notifyEventCancellation(event.id);

    res.json(event);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await eventService.deleteEvent(parseInt(req.params.id, 10), req.user!.id, req.user!.role);
    res.json({ message: 'Event deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getOrganizerEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: EventFilters = {
      organizerId: req.user!.id,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: Math.min(req.query.limit ? parseInt(req.query.limit as string, 10) : 20, 100),
    };

    const result = await eventService.getEvents(filters);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const topN = req.query.topN ? parseInt(req.query.topN as string, 10) : 10;
    const recommendedIds = await getRecommendationsForUser(req.user!.id, topN);

    if (recommendedIds.length === 0) {
      res.json({ events: [], message: 'Not enough interaction data for personalized recommendations' });
      return;
    }

    const { default: prisma } = await import('../config/prisma');
    const events = await prisma.event.findMany({
      where: { id: { in: recommendedIds }, status: 'PUBLISHED' },
    });
    // Return in recommendation score order
    const ordered = recommendedIds.map((id) => events.find((e) => e.id === id)).filter(Boolean);
    res.json({ events: ordered });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
