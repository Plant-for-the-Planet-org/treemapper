import { configureStore } from '@reduxjs/toolkit';
import envSlice from './slices/envSlice';
import appSlice from './slices/appSlice';


export const store = configureStore({
  reducer: {
    envSlice,
    appSlice
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
