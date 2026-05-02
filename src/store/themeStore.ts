/**
 * Theme store — persists dark mode preference to localStorage.
 */
import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
}

// Read initial value from localStorage
const getInitial = (): boolean => {
  try {
    return localStorage.getItem('ruralconnect_dark') === '1';
  } catch {
    return false;
  }
};

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: getInitial(),
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      try { localStorage.setItem('ruralconnect_dark', next ? '1' : '0'); } catch {}
      return { isDark: next };
    }),
}));
