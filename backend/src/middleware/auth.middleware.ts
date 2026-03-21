import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    status: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded as any;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
