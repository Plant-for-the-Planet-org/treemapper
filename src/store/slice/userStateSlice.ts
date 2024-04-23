import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {UserInterface} from 'src/types/interface/slice.interface'

export const initialUserState: UserInterface = {
  country: '',
  created: '',
  displayName: '',
  email: '',
  firstname: '',
  id: '',
  image: '',
  isPrivate: false,
  lastname: '',
  locale: '',
  name: '',
  slug: '',
  type: '',
  loading: false
}

const userStateSlice = createSlice({
  name: 'userStateSlice',
  initialState: initialUserState,
  reducers: {
    updateLoadingUser(state, action: PayloadAction<boolean>){
      state.loading = action.payload
    },
    updateUserDetails(_state, action: PayloadAction<UserInterface>) {
      return {...action.payload}
    },
    resetUserDetails() {
      return {...initialUserState}
    },
  },
})

export const {updateUserDetails, resetUserDetails, updateLoadingUser} = userStateSlice.actions

export default userStateSlice.reducer
