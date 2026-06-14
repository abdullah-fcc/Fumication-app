import { createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker' | 'client';
}

export async function storeAuth(token: string, user: AuthUser): Promise<void> {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('token');
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove(['token', 'user']);
}

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextValue>({ user: null, setUser: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}
