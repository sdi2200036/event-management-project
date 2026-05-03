import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { signToken } from '../utils/jwt.utils';
import { RegisterDTO, LoginDTO, User } from '../models/user.model';

export const register = async (dto: RegisterDTO): Promise<{ message: string }> => {
  const { username, password, first_name, last_name, email, phone, address, city, country, postal_code, afm, role } = dto;

  // Check if username or email already exists
  const existing = await query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );
  if (existing.rows.length > 0) {
    throw new Error('Username or email already in use');
  }

  const password_hash = await bcrypt.hash(password, 10);

  await query(
    `INSERT INTO users (username, password_hash, first_name, last_name, email, phone, address, city, country, postal_code, afm, role, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending')`,
    [username, password_hash, first_name, last_name, email, phone, address, city, country, postal_code, afm, role]
  );

  return { message: 'Registration successful. Awaiting admin approval.' };
};

// Used to ensure constant-time comparison even when the user doesn't exist (prevents timing attacks)
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export const login = async (dto: LoginDTO): Promise<{ token: string; user: Partial<User> }> => {
  const { username, password } = dto;

  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  const user: User | null = result.rows[0] ?? null;

  // Always run bcrypt.compare to prevent username enumeration via timing
  const hash = user ? user.password_hash : DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    throw new Error('Invalid credentials');
  }

  // Generic message for non-approved accounts — don't reveal exact status
  if (user.status !== 'approved') {
    throw new Error('Invalid credentials');
  }

  const token = signToken({ id: user.id, username: user.username, role: user.role, status: user.status });

  const { password_hash, ...userPublic } = user;
  return { token, user: userPublic };
};

export const approveUser = async (userId: number): Promise<void> => {
  const result = await query(
    "UPDATE users SET status = 'approved' WHERE id = $1 RETURNING id",
    [userId]
  );
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
};

export const rejectUser = async (userId: number): Promise<void> => {
  const result = await query(
    "UPDATE users SET status = 'rejected' WHERE id = $1 AND status = 'pending' RETURNING id",
    [userId]
  );
  if (result.rows.length === 0) {
    throw new Error('User not found or is not pending');
  }
};

export const suspendUser = async (userId: number): Promise<void> => {
  const result = await query(
    "UPDATE users SET status = 'suspended' WHERE id = $1 AND status = 'approved' RETURNING id",
    [userId]
  );
  if (result.rows.length === 0) {
    throw new Error('User not found or is not approved');
  }
};
