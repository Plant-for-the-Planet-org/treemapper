import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';



interface AppInitialState {
  treeMarkerCarousel: number;
}

const initialState: AppInitialState = {
  treeMarkerCarousel: 0
};

export const appSlice = createSlice({
  name: 'appSlice',
  initialState,
  reducers: {
    updateTreeMarkerCarousel: (state, action: PayloadAction<number>) => {
      state.treeMarkerCarousel = action.payload;
    },
  },
});

export const { updateTreeMarkerCarousel } = appSlice.actions;
export default appSlice.reducer;
