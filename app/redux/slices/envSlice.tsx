import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { ENV_TYPE } from '../../environment';
import { modifyUserDetails } from '../../repositories/user';

interface EnvState {
  currentEnv: string;
}

const initialState: EnvState = {
  currentEnv: ENV_TYPE.STAGING,
};

export const envSlice = createSlice({
  name: 'envSlice',
  initialState,
  reducers: {
    SET_APP_ENVIRONMENT: (state, action: PayloadAction<string>) => {
      modifyUserDetails({
        appEnvironment: action.payload,
      });
      state.currentEnv = action.payload;
    },
  },
});

export const { SET_APP_ENVIRONMENT } = envSlice.actions;
export default envSlice.reducer;
