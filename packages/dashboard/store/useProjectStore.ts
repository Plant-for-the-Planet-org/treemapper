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
  projects: [
    {
      id: 'proj-001',
      projectName: 'GreenRoots Reforestation',
      projectType: 'Afforestation',
      ecosystem: 'Tropical Forest',
      projectScale: 'Large',
      target: 100000, // trees to be planted
      projectWebsite: 'https://greenroots.org',
      description: 'Large-scale reforestation project aiming to restore degraded tropical rainforest areas.',
      isPublic: true,
      createdById: 'user-001',
      createdAt: '2024-03-15T10:00:00Z',
      updatedAt: '2025-04-20T08:30:00Z',
      metadata: {
        fundingSource: 'NGO',
        carbonOffsetTarget: '25,000 tons/year'
      },
      location: {
        type: 'Polygon',
        coordinates: [
          [
            [101.343, 3.123],
            [101.351, 3.128],
            [101.348, 3.134],
            [101.340, 3.129],
            [101.343, 3.123]
          ]
        ]
      },
      userRole: 'owner'
    },
    {
      id: 'proj-002',
      projectName: 'Urban Canopy Initiative',
      projectType: 'Urban Greening',
      ecosystem: 'Urban',
      projectScale: 'Medium',
      target: 5000,
      projectWebsite: 'https://urbancanopy.org',
      description: 'Community-driven initiative to plant native trees in urban neighborhoods.',
      isPublic: true,
      createdById: 'user-002',
      createdAt: '2023-07-10T14:45:00Z',
      updatedAt: '2025-01-05T09:12:00Z',
      metadata: {
        partners: ['City Council', 'Local Schools'],
        educationalComponent: true
      },
      location: {
        type: 'Point',
        coordinates: [-0.1276, 51.5074] // London
      },
      userRole: 'admin'
    },
    {
      id: 'proj-003',
      projectName: 'Mangrove Revival Project',
      projectType: 'Conservation',
      ecosystem: 'Coastal Wetlands',
      projectScale: 'Small',
      target: 20000,
      projectWebsite: 'https://mangroverevival.org',
      description: 'Focused conservation and protection of existing mangrove forests along the coast.',
      isPublic: false,
      createdById: 'user-003',
      createdAt: '2022-11-22T11:20:00Z',
      updatedAt: '2025-03-18T13:40:00Z',
      metadata: {
        endangeredSpeciesProtected: ['Rhizophora mucronata'],
        monitoredBy: 'Marine Ecology Dept'
      },
      location: {
        type: 'Polygon',
        coordinates: [
          [
            [80.245, 13.052],
            [80.248, 13.054],
            [80.250, 13.050],
            [80.247, 13.048],
            [80.245, 13.052]
          ]
        ]
      },
      userRole: 'contributor'
    }
  ],
  selectedProject: 'proj-001',
  addProjects: p => set(state => ({ ...state, projects: p })),
  selectProject: p => set(state => ({ ...state, selectedProject: p })),
}))

export default useStore
