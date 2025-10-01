import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ProjectStateSlice } from 'src/types/interface/slice.interface'

const initialState: ProjectStateSlice = {
  projectAdded: false,
  errorOccurred: false,
  currentProject: {
    projectName: '',
    projectId: '',
  },
  projectSite: {
    siteName: '',
    siteId: '',
  },
}

const projectStateSlice = createSlice({
  name: 'projectStateSlice',
  initialState,
  reducers: {
    updateProjectState(state, action: PayloadAction<boolean>) {
      state.projectAdded = action.payload
    },
    updateProjectError(state, action: PayloadAction<boolean>) {
      state.projectAdded = action.payload
    },
    updateCurrentProject(
      state,
      action: PayloadAction<{ name: string; id: string }>,
    ) {
      state.currentProject = {
        projectName: action.payload.name,
        projectId: action.payload.id,
      }
    },
    updateProjectSite(
      state,
      action: PayloadAction<{ name: string; id: string }>,
    ) {
      state.projectSite = {
        siteName: action.payload.name,
        siteId: action.payload.id,
      }
    },
    resetProjectState() {
      return { ...initialState }
    }
  },
})

export const { updateProjectError, updateProjectState, updateProjectSite, updateCurrentProject, resetProjectState } =
  projectStateSlice.actions

export default projectStateSlice.reducer
