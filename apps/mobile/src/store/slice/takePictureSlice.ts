import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {TakePictureInitialState} from 'src/types/interface/slice.interface'

const initialState: TakePictureInitialState = {
  url: '',
  id: '',
  width: 0,
  height: 0,
}

const takePictureSlice = createSlice({
  name: 'takePictureSlice',
  initialState,
  reducers: {
    updateImageDetails(
      state,
      action: PayloadAction<{id: string; url: string}>,
    ) {
      state.url = action.payload.url
      state.id = action.payload.id
    },
  },
})

export const {updateImageDetails} = takePictureSlice.actions

export default takePictureSlice.reducer
