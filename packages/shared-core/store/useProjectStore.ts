import { create } from 'zustand'
import { ProjectWithUserRoleI } from '../types/interface.app'

interface ProjectStore {
  projects: ProjectWithUserRoleI[]
  selectedProject: ProjectWithUserRoleI | null
  addProjects: (p: ProjectWithUserRoleI[]) => void
  selectProject: (p: ProjectWithUserRoleI) => void
  loading?: boolean
  error?: string
  selectedWorkspce: {
    name: string,
    uid: string,
    role: string
  } | null
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
  setDefaultWorkspce: (p: {
    name: string,
    uid: string,
    role: string
  }) => void
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
