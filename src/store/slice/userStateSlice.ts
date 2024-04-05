import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {UserInterface} from 'src/types/interface/slice.interface'

const initialState: UserInterface = {
  accessToken: '',
  idToken: '',
  email: '',
  firstName: '',
  lastName: '',
  image: '',
  country: '',
  idLogEnabled: false,
  userId: '',
  type: '',
  lastUpdatedAt: '',
}

const userStateSlice = createSlice({
  name: 'userStateSlice',
  initialState,
  reducers: {
    updateUserDetails(_state, action: PayloadAction<UserInterface>) {
      return {...action.payload}
    },
  },
})

export const {updateUserDetails} = userStateSlice.actions

export default userStateSlice.reducer
