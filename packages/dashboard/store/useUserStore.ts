import { create } from 'zustand'
import { UserInterface } from '../types/app.interface'

interface UserStore {
  user: UserInterface | null
  setUser: (user: UserInterface) => void
  clearUser: () => void
  updateUser: (updates: Partial<UserInterface>) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  updateUser: (updates) =>
    set((state) => state.user ? { user: { ...state.user, ...updates } } : {}),
}))