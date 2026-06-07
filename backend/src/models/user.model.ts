export type UserRole = 'admin' | 'organizer' | 'participant';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  geo_lat?: number;
  geo_lng?: number;
  afm?: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
}

export interface UserPublic extends Omit<User, 'password_hash'> {}

export interface RegisterDTO {
  username: string;
  password: string;
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

export interface LoginDTO {
  username: string;
  password: string;
}
