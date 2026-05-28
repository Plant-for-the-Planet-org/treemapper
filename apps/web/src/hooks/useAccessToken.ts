'use client';

import { useCallback } from 'react';
import { useUserStore } from '@shared-core/store/useUserStore';
import { useAuthStore } from '@/stores/auth-store';

// Compat shim. Kept the original return shape so existing consumers
// (DashboardClientLayout, LoginContent, settings/profile pages, sidebar,
// header components) keep compiling. Token + auth state come from the
// Zustand auth-store; profile comes from shared-core useUserStore as before.
export function useAccessToken() {
  const accessToken = useAuthStore(state => state.accessToken);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const error = useAuthStore(state => state.error);
  const user = useUserStore(state => state.user);

  const refreshToken = useCallback(() => {
    // No-op: auth-store rehydrates from localStorage on mount and silent
    // auth runs there. Retained for backwards compatibility with old callers.
  }, []);

  return {
    accessToken: accessToken ?? '',
    tokenLoading: isAuthInitializing,
    tokenError: error ? new Error(error) : null,
    user: isAuthenticated ? user : null,
    refreshToken,
  };
}
