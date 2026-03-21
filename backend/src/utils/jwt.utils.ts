import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  status: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
