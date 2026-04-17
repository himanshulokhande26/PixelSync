import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (userData) => set({ user: userData }),
      logout: () => set({ user: null }),
    }),
    { name: "pixelsync-auth" } // persisted to localStorage
  )
);
