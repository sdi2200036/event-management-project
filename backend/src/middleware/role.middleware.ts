import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Factory function that returns middleware restricting access to users with specified roles.
 * Usage: router.get('/admin', authenticate, requireRole('admin'), handler)
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
      return;
    }

    if (req.user.status !== 'approved') {
      res.status(403).json({
        message: 'Your account is pending approval or has been rejected.',
      });
      return;
    }

    next();
  };
};
