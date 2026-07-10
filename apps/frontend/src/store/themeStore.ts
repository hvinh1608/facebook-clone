import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  setTheme: (theme) => {
    localStorage.setItem('nexus_theme', theme);
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    const stored = (localStorage.getItem('nexus_theme') as Theme) || 'light';
    applyTheme(stored);
    set({ theme: stored });
  },
}));
