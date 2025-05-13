import { create } from 'zustand'
import { ProjectWithUserRoleI } from '../types/app.interface'

interface ProjectStore {
  projects: ProjectWithUserRoleI[]
  selectedProject: string
  addProjects: (p: ProjectWithUserRoleI[]) => void
  selectProject: (p: string) => void
}

// Create the typed store
const useStore = create<ProjectStore>(set => ({
  projects: [],
  selectedProject: '',
  addProjects: p => set(state => ({ ...state, projects: p })),
  selectProject: p => set(state => ({ ...state, selectedProject: p })),
}))

export default useStore
