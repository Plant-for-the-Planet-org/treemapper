import { create } from 'zustand'
import { ProjectWithUserRoleI } from '../types/app.interface'

interface ProjectStore {
  projects: ProjectWithUserRoleI[]
  selectedProject: ProjectWithUserRoleI | null
  addProjects: (p: ProjectWithUserRoleI[]) => void
  selectProject: (p: ProjectWithUserRoleI) => void
  loading?: boolean
}

// Create the typed store
const useStore = create<ProjectStore>(set => ({
  projects: [],
  selectedProject: null,
  addProjects: p => set(state => ({ ...state, projects: p, loading:false })),
  selectProject: p => set(state => ({ ...state, selectedProject: p })),
  loading: true
}))

export default useStore
