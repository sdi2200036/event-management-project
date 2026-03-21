import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as exportService from '../services/export.service';

export const exportXML = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const xml = await exportService.exportEventsXML();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="events.xml"');
    res.send(xml);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const exportJSON = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await exportService.exportEventsJSON();
    res.setHeader('Content-Disposition', 'attachment; filename="events.json"');
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
