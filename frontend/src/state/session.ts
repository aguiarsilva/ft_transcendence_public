import type { User } from '@/api/types';

export const session = {
  setAuth(token: string, user: User) {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
  token() {
    return sessionStorage.getItem('token');
  },
  user(): User | null {
    const raw = sessionStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  },
  isAuthenticated() {
    return !!sessionStorage.getItem('token');
  },
};
