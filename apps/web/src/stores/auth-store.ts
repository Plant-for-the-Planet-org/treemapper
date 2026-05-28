import { create } from 'zustand';

interface AuthStore {
  accessToken: string | null;
  isAuthenticated: boolean;
  isAuthInitializing: boolean;
  error: string | null;

  setAccessToken: (token: string | null) => void;
  setIsAuthInitializing: (value: boolean) => void;
  clearAuth: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessToken: null,
  isAuthenticated: false,
  isAuthInitializing: true,
  error: null,

  setIsAuthInitializing: (value) => set({ isAuthInitializing: value }),

  setAccessToken: (token) => {
    if (!token) {
      get().clearAuth();
      return;
    }

    if (get().accessToken === token) return;

    if (isBrowser) {
      localStorage.setItem('access_token', token);
    }

    set({ accessToken: token, isAuthenticated: true, error: null });
  },

  clearAuth: () => {
    if (isBrowser) {
      localStorage.removeItem('access_token');
    }
    set({
      accessToken: null,
      isAuthenticated: false,
      isAuthInitializing: false,
      error: null,
    });
  },
}));
