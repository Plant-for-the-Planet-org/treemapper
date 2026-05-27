import { create } from 'zustand'
import { ProjectWithUserRoleI } from '../types/interface.app'

interface ProjectStore {
  projects: ProjectWithUserRoleI[]
  selectedProject: ProjectWithUserRoleI | null
  addProjects: (p: ProjectWithUserRoleI[]) => void
  selectProject: (p: ProjectWithUserRoleI) => void
  loading?: boolean
  error?: string
  selectedWorkspce: WorkspaceSummary | null
  workspace: Array<WorkspaceSummary>
  addWorkspace: (p: Array<WorkspaceSummary>) => void
  setDefaultWorkspce: (p: WorkspaceSummary) => void
}

interface WorkspaceSummary {
  name: string
  uid: string
  userRole: string
  type: string
  slug?: string
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
  loading: false,
  error: '',
  workspace: [],
  addWorkspace: p => set(state => ({ ...state, workspace: p })),
  setDefaultWorkspce: p => set(state => ({ ...state, selectedWorkspce: p })),
  selectedWorkspce: null
}))

export default useStore
