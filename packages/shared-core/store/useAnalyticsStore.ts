import { create } from 'zustand'
import { UserInterface } from '../types/interface.app'

interface AnalyticsStore {
  startDate: string
  endDate: string
  setGlobalStartDate: (d: string) => void
  setGlobalEndDate: (d: string) => void
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  startDate: new Date().toISOString(),
  endDate: new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()).toISOString(),
  setGlobalStartDate: (d) => set({ startDate:d }),
  setGlobalEndDate: (d) => set({ endDate:d }),
}))