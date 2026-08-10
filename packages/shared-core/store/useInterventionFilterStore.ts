import { create } from 'zustand'

interface InterventionFilterStore {
  // 'YYYY-MM-DD' strings; empty string means no bound (all time)
  startDate: string
  endDate: string
  setDateRange: (start: string, end: string) => void
  resetDateRange: () => void
}

export const useInterventionFilterStore = create<InterventionFilterStore>((set) => ({
  startDate: '',
  endDate: '',
  setDateRange: (start, end) => set({ startDate: start, endDate: end }),
  resetDateRange: () => set({ startDate: '', endDate: '' }),
}))
