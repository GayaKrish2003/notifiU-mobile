export type UserRole = 'superadmin' | 'student' | 'lecturer' | 'jobprovider';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
}