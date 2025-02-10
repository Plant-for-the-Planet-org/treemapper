// /store/slice/userSlice.ts
import { create } from 'zustand'
import { User } from '../types/user.types'

interface UserState {
  user: User | null
  setUser: (user: User | null) => void
  updateFirstName: (firstName: string) => void
  updateLastName: (lastName: string) => void
}

export const useUserStore = create<UserState>()((set) => ({
  user: {firstName:"",lastName:""},
  setUser: (user) => set({ user }),
  updateFirstName: (firstName) => 
    set((state) => ({
      user: state.user ? { ...state.user, firstName } : null
    })),
  updateLastName: (lastName) => 
    set((state) => ({
      user: state.user ? { ...state.user, lastName } : null
    }))
}))