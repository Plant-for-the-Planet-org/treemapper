import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TreeType } from '../utils/inventoryConstants';

export interface RegistrationState {
  treeType: TreeType | '';
  plantLocationId: string;
}

const initialState: RegistrationState = {
  treeType: '',
  plantLocationId: '',
};

export const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    setTreeType: (state, action: PayloadAction<TreeType | ''>) => {
      state.treeType = action.payload;
    },
    setPlantLocationId: (state, action: PayloadAction<string>) => {
      state.plantLocationId = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setTreeType, setPlantLocationId } = registrationSlice.actions;

export default registrationSlice.reducer;
