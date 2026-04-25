export type Role = 'admin' | 'manager' | 'worker' | 'client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') ?? sessionStorage.getItem('token');
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: AuthUser, remember: boolean): void {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('token', token);
  // User info always in localStorage so it survives page refreshes
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
}
