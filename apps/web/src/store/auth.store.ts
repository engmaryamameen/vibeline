import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@vibeline/types';

type AuthState = {
  token: string | null;
  currentUser: User | null;
  hasHydrated: boolean;
  setSession: (payload: { token: string; currentUser: User }) => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      currentUser: null,
      hasHydrated: false,
      setSession: ({ token, currentUser }) => set({ token, currentUser }),
      clearSession: () => set({ token: null, currentUser: null }),
      setHasHydrated: (value) => set({ hasHydrated: value })
    }),
    {
      name: 'vibeline-auth',
      partialize: (state) => ({
        token: state.token,
        currentUser: state.currentUser
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
