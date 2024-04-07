import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {ProjectStateSlice} from 'src/types/interface/slice.interface'

const initialState: ProjectStateSlice = {
  projectAdded: false,
  errorOccured: false,
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
  },
})

export const {updateProjectError, updateProjectState} = projectStateSlice.actions

export default projectStateSlice.reducer
