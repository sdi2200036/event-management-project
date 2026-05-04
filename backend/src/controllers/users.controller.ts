import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import * as authService from '../services/auth.service';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, status } = req.query;
    let sql = 'SELECT id, username, first_name, last_name, email, phone, city, country, role, status, created_at FROM users WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (role) {
      sql += ` AND role = $${idx++}`;
      params.push(role);
    }
    if (status) {
      sql += ` AND status = $${idx++}`;
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await query(
      'SELECT id, username, first_name, last_name, email, phone, address, city, country, postal_code, afm, role, status, created_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const user = result.rows[0];
    const caller = req.user!;
    if (caller.role !== 'admin' && caller.id !== id) {
      delete user.afm;
    }
    res.json(user);
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

