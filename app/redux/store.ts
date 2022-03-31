import { configureStore } from '@reduxjs/toolkit';
import registrationReducer from './registrationSlice';
import deviceDetailsReducer from './deviceDetailsSlice';
import modalReducer from './modalSlice';

export const store = configureStore({
  reducer: {
    registration: registrationReducer,
    deviceDetails: deviceDetailsReducer,
    modal: modalReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
