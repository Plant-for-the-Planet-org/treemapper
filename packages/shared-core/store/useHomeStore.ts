import { create } from 'zustand'
import { HomeParentTabT } from '../types/app.type'

interface ProjectStore {
  parentTab: HomeParentTabT
  childTab: string
  setParentTab: (p: HomeParentTabT) => void
  setChildTab: (p: string) => void
  orgType: string
  setOrgType: (p: string) => void
}

// Create the typed store
const useStore = create<ProjectStore>(set => ({
  parentTab: 'overview',
  childTab: '',
  orgType: '',
  setParentTab: (p) => set(state => ({ ...state, parentTab: p })),
  setChildTab: p => set(state => ({ ...state, childTab: p })),
  setOrgType: (p) => set(state => ({ ...state, orgType: p })),
}))

export default useStore
