import { create } from 'zustand'
import { ProjectWithUserRoleI } from '../types/app.interface'

interface ProjectStore {
  projects: ProjectWithUserRoleI[]
  selectedProject: ProjectWithUserRoleI | null
  addProjects: (p: ProjectWithUserRoleI[]) => void
  selectProject: (p: ProjectWithUserRoleI) => void
  updatePrjError: (error: string) => void
  updateProjectLoading: (b: boolean) => void,
  clearPrjError: () => void
  loading?: boolean
  error?: string
}

// Create the typed store
const useStore = create<ProjectStore>(set => ({
  projects: [],
  selectedProject: null,
  addProjects: p => set(state => ({ ...state, projects: p, loading: false })),
  selectProject: p => set(state => ({ ...state, selectedProject: p })),
  updateProjectLoading:b => set(state => ({ ...state, loading: b })),
  loading: true,
  error: '',
  updatePrjError: (error: string) => set(state => ({ ...state, error, loading: false })),
  clearPrjError: () => set(state => ({ ...state, error: '', loading: true}))
}))

export default useStore
