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
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken?: string | null) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
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

  const getInitialRefreshToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_refresh');
    }
    return null;
  };

  const initialUser = getInitialUser();
  const initialToken = getInitialToken();
  const initialRefreshToken = getInitialRefreshToken();
  const normalizedInitialUser = initialUser ? normalizeAuthUser(initialUser) : null;

  return {
    user: normalizedInitialUser,
    accessToken: initialToken,
    refreshToken: initialRefreshToken,
    isAuthenticated: !!initialToken,
    login: (user, accessToken, refreshToken) => {
      const normalizedUser = normalizeAuthUser(user);
      localStorage.setItem('nexus_user', JSON.stringify(normalizedUser));
      localStorage.setItem('nexus_token', accessToken);
      set((state) => {
        const nextRefresh = refreshToken ?? state.refreshToken;
        if (nextRefresh) {
          localStorage.setItem('nexus_refresh', nextRefresh);
        }
        return {
          user: normalizedUser,
          accessToken,
          refreshToken: nextRefresh,
          isAuthenticated: true,
        };
      });
    },
    logout: () => {
      localStorage.removeItem('nexus_user');
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_refresh');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
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
