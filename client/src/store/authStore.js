import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * SECURE AUTH STORE
 * FIX 03: Tokens removed from local state. Session managed via server-side httpOnly cookies.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      clearAuth: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
