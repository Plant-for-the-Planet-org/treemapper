import { Platform } from 'react-native';
import { Storage } from './types';
import { WebStorage } from './web';
import { NativeStorage } from './native';

export const storage: Storage = Platform.OS === 'web' 
  ? new WebStorage()
  : new NativeStorage();

// packages/api/src/api/types.ts
export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}
