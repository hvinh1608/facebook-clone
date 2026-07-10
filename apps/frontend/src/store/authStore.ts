import { create } from 'zustand';
import { normalizeAuthUser } from '../utils/avatar';

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  displayName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state from localStorage if client-side
  const getInitialUser = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexus_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        localStorage.removeItem('nexus_user');
        return null;
      }
    }
    return null;
  };

  const getInitialToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_token');
    }
    return null;
  };

  const initialUser = getInitialUser();
  const initialToken = getInitialToken();
  const normalizedInitialUser = initialUser ? normalizeAuthUser(initialUser) : null;

  return {
    user: normalizedInitialUser,
    accessToken: initialToken,
    isAuthenticated: !!initialToken,
    login: (user, accessToken) => {
      const normalizedUser = normalizeAuthUser(user);
      localStorage.setItem('nexus_user', JSON.stringify(normalizedUser));
      localStorage.setItem('nexus_token', accessToken);
      set({ user: normalizedUser, accessToken, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('nexus_user');
      localStorage.removeItem('nexus_token');
      set({ user: null, accessToken: null, isAuthenticated: false });
    },
    updateUser: (updatedUser) => {
      set((state) => {
        if (!state.user) return state;
        const newUserData = normalizeAuthUser({ ...state.user, ...updatedUser });
        localStorage.setItem('nexus_user', JSON.stringify(newUserData));
        return { user: newUserData };
      });
    },
  };
});
