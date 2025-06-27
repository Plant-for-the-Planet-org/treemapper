import { create } from 'zustand'
import { UserInterface } from '../types/app.interface'

interface AnalyticsStore {
  startDate: string
  endDate: string
  setGlobalStartDate: (d: string) => void
  setGlobalEndDate: (d: string) => void
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  startDate: new Date().toISOString(),
  endDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
  setGlobalStartDate: (d) => set({ startDate:d }),
  setGlobalEndDate: (d) => set({ endDate:d }),
}))