import { create } from 'zustand'
import { ProjectWithUserRoleI } from '../types/interface.app'

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
  workspace: Array<{
    name: string,
    uid: string,
    role: string
  }>
  addWorkspace: (p: Array<{
    name: string,
    uid: string,
    role: string
  }>) => void
}

// Create the typed store
const useStore = create<ProjectStore>(set => ({
  projects: [],
  selectedProject: null,
  addProjects: p => set(state => ({ ...state, projects: p, loading: false })),
  selectProject: p => set(state => {
    localStorage.setItem('project', p ? p.uid : '')
    return ({ ...state, selectedProject: p })
  }),
  updateProjectLoading: b => set(state => ({ ...state, loading: b })),
  loading: true,
  error: '',
  updatePrjError: (error: string) => set(state => ({ ...state, error, loading: false })),
  clearPrjError: () => set(state => ({ ...state, error: '', loading: true })),
  workspace: [],
  addWorkspace: p => set(state => ({ ...state, workspace: p })),
}))

export default useStore
