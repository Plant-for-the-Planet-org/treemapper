import { create } from 'zustand'
import { ProjectsI } from '../types/app.interface'

interface ProjectStore {
  projects: ProjectsI[]
  selectedProject: string
  addProjects: (p: ProjectsI[]) => void
  selectProject: (p: string) => void
}

// Create the typed store
const useStore = create<ProjectStore>(set => ({
  projects: [
    {
      name: 'Shyam',
      id: '123',
      description: 'kldj',
      status: 'acrive',
    },
    {
      name: 'Ram',
      id: '243',
      description: 'kldj',
      status: 'acrive',
    },
  ],
  selectedProject: '',
  addProjects: p => set(state => ({ ...state, projects: p })),
  selectProject: p => set(state => ({ ...state, selectedProject: p })),
}))

export default useStore
