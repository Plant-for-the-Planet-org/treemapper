import {configureStore, combineReducers} from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {useDispatch} from 'react-redux'
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import appStateSlice from './slice/appStateSlice'
import gpsStateSlice from './slice/gpsStateSlice'
import takePictureSlice from './slice/takePictureSlice'
import registerFormSlice from './slice/registerFormSlice'
import sampleTreeSlice from './slice/sampleTreeSlice'
import userStateSlice from './slice/userStateSlice'
import projectStateSlice from './slice/projectStateSlice';

const appReducer = combineReducers({
  appState: appStateSlice,
  gpsState: gpsStateSlice,
  cameraState: takePictureSlice,
  formFlowState: registerFormSlice,
  sampleTree: sampleTreeSlice,
  userState: userStateSlice,
  projectState: projectStateSlice
})

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['appState', 'gpsState', 'userState', 'projectState'],
}

const persistedReducer = persistReducer(persistConfig, appReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()

export const persistor = persistStore(store)

export default store
