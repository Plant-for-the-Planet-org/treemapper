import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserInterface } from 'src/types/interface/slice.interface'

export const initialUserState: UserInterface = {
  country: '',
  created: '',
  displayName: '',
  email: '',
  firstName: '',
  id: '',
  image: '',
  isPrivate: false,
  lastName: '',
  locale: '',
  name: '',
  slug: '',
  type: '',
  v3Approved: false,
  showPlotFeature: true
}

const userStateSlice = createSlice({
  name: 'userStateSlice',
  initialState: initialUserState,
  reducers: {
    updateUserDetails(state, action: PayloadAction<UserInterface>) {
      // Merge so fields the server profile omits (e.g. showPlotFeature) keep
      // their existing value instead of becoming undefined on login.
      return { ...state, ...action.payload }
    },
    resetUserDetails() {
      return { ...initialUserState }
    },
    updateName(state, action: PayloadAction<{ firstName: string, lastName: string }>) {
      state.firstName = action.payload.firstName
      state.lastName = action.payload.lastName
    },
  },
})

export const { updateUserDetails, resetUserDetails, updateName } = userStateSlice.actions

export default userStateSlice.reducer
