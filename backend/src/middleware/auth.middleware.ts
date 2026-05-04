import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { verifyToken } from '../utils/jwt.utils';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    status: string;
  };
}

export const optionalAuthenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = verifyToken(authHeader.split(' ')[1]) as any;
      const result = await query('SELECT status FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length > 0 && result.rows[0].status === 'approved') {
        req.user = decoded;
      }
    } catch {
      // Invalid token — continue as guest
    }
  }
  next();
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token) as any;

    // Check live status from DB so suspended/rejected users are blocked immediately
    const result = await query('SELECT status FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0 || result.rows[0].status !== 'approved') {
      res.status(401).json({ message: 'Account is not active' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
