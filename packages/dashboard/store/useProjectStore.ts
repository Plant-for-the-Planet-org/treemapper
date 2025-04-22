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
      name: 'Yucatán Restoration',
      id: '1',
      description: 'kldj',
      status: 'acrive',
    },
    {
      name: 'PlanBe Forest',
      id: '2',
      description: 'kldj',
      status: 'acrive',
    },
    {
      name: 'Reforest Toluca',
      id: '3',
      description: 'kldj',
      status: 'acrive',
    },
    {
      name: 'Volcano Valley Reforestation',
      id: '4',
      description: 'kldj',
      status: 'acrive',
    },
  ],
  selectedProject: '1',
  addProjects: p => set(state => ({ ...state, projects: p })),
  selectProject: p => set(state => ({ ...state, selectedProject: p })),
}))

export default useStore
