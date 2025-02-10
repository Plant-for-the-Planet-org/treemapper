export const createProjectSlice = (set, get) => ({
    projects: [],
    currentProject: null,
    setProjects: (projects) => set({ projects }),
    setCurrentProject: (project) => set({ currentProject: project }),
    addProject: (project) => set((state) => ({ 
      projects: [...state.projects, project] 
    }))
  });