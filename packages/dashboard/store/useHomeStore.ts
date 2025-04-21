import { create } from 'zustand'

interface ProjectStore {
  parentTab:string
  childTab: string
  setParentTab: (p: string) => void
  setChildTab: (p: string) => void
}


// Create the typed store
const useStore = create<ProjectStore>(set => ({
  parentTab: '',
  childTab: '',
  setParentTab: p => set(state => ({ ...state, parentTab: p })),
  setChildTab: p => set(state => ({ ...state, childTab: p })),
}))

export default useStore
