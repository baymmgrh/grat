import {
  api
} from 'lucide-react';
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import { api } from './api'
import { returnsApi } from '../services/returnsApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
    [returnsApi.reducerPath]: returnsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, returnsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
