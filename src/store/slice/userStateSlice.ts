import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {UserInterface} from 'src/types/interface/slice.interface'

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
}

const userStateSlice = createSlice({
  name: 'userStateSlice',
  initialState: initialUserState,
  reducers: {
    updateUserDetails(_state, action: PayloadAction<UserInterface>) {
      return {...action.payload}
    },
    resetUserDetails() {
      return {...initialUserState}
    },
  },
})

export const {updateUserDetails, resetUserDetails} = userStateSlice.actions

export default userStateSlice.reducer
