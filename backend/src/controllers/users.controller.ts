import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import * as authService from '../services/auth.service';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, status } = req.query;

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        ...(status ? { status: status as any } : {}),
      },
      select: {
        id: true, username: true, first_name: true, last_name: true,
        email: true, phone: true, city: true, country: true,
        role: true, status: true, created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, first_name: true, last_name: true,
        email: true, phone: true, address: true, city: true, country: true,
        postal_code: true, afm: true, role: true, status: true, created_at: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const caller = req.user!;
    const result: any = { ...user };
    if (caller.role !== 'admin' && caller.id !== id) {
      delete result.afm;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const approveUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await authService.approveUser(parseInt(req.params.id, 10));
    res.json({ message: 'User approved successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const rejectUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await authService.rejectUser(parseInt(req.params.id, 10));
    res.json({ message: 'User rejected' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await authService.suspendUser(parseInt(req.params.id, 10));
    res.json({ message: 'User suspended' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
