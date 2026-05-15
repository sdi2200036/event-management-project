import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { signToken } from '../utils/jwt.utils';
import { RegisterDTO, LoginDTO } from '../models/user.model';

export const register = async (dto: RegisterDTO): Promise<{ message: string }> => {
  const { username, password, first_name, last_name, email, phone, address, city, country, postal_code, afm, role } = dto;

  if (!afm || !/^\d{9}$/.test(afm)) {
    throw new Error('AFM must be exactly 9 digits');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }, { afm }] },
    select: { username: true, email: true, afm: true },
  });
  if (existing) {
    if (existing.afm === afm) throw new Error('An account with this AFM already exists');
    throw new Error('Username or email already in use');
  }

  const password_hash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: { username, password_hash, first_name, last_name, email, phone, address, city, country, postal_code, afm, role: role as any },
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const field = err?.meta?.target?.[0];
      if (field === 'afm') throw new Error('An account with this AFM already exists');
      if (field === 'email') throw new Error('Email already in use');
      throw new Error('Username already in use');
    }
    throw err;
  }

  return { message: 'Registration successful. Awaiting admin approval.' };
};

const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export const login = async (dto: LoginDTO): Promise<{ token: string; user: object }> => {
  const { username, password } = dto;

  const user = await prisma.user.findUnique({ where: { username } });

  const hash = user ? user.password_hash : DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid || user.status !== 'approved') {
    throw new Error('Invalid credentials');
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role, status: user.status });
  const { password_hash: _, ...userPublic } = user;
  return { token, user: userPublic };
};

export const approveUser = async (userId: number): Promise<void> => {
  const result = await prisma.user.updateMany({
    where: { id: userId, status: 'pending' },
    data: { status: 'approved' },
  });
  if (result.count === 0) throw new Error('User not found or is not pending');
};

export const rejectUser = async (userId: number): Promise<void> => {
  const result = await prisma.user.updateMany({
    where: { id: userId, status: 'pending' },
    data: { status: 'rejected' },
  });
  if (result.count === 0) throw new Error('User not found or is not pending');
};

export const suspendUser = async (userId: number): Promise<void> => {
  const result = await prisma.user.updateMany({
    where: { id: userId, status: 'approved' },
    data: { status: 'suspended' },
  });
  if (result.count === 0) throw new Error('User not found or is not approved');
};
