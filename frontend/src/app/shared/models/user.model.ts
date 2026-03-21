export type UserRole = 'admin' | 'organizer' | 'participant';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  afm?: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  afm?: string;
  role: 'organizer' | 'participant';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
