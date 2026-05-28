'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  exchangeCodeForTokens,
  getAccessTokenSilently,
} from '@/lib/auth/auth0-config';
import { cleanUrl, getValidStoredToken } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/auth-store';

async function handleCodeExchange(code: string) {
  cleanUrl(['code']);
  const tokens = await exchangeCodeForTokens(code);
  return tokens.access_token;
}

export function AuthInitializer() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const logoutSuccess = searchParams.get('logoutSuccess');

  const setIsAuthInitializing = useAuthStore(
    state => state.setIsAuthInitializing
  );
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const clearAuth = useAuthStore(state => state.clearAuth);

  const didStartInit = useRef(false);

  useEffect(() => {
    // Silent auth runs in a hidden iframe that lands on /redirecting?code=X.
    // AuthInitializer lives in the root layout so it mounts inside that iframe
    // too — but that instance has no in-memory PKCE verifier and would fail
    // the code exchange, then wipe access_token from localStorage (shared
    // across same-origin frames).
    if (typeof window !== 'undefined' && window.self !== window.top) return;
    if (logoutSuccess === 'true') return;
    if (didStartInit.current) return;
    didStartInit.current = true;

    const init = async () => {
      try {
        if (code) {
          const token = await handleCodeExchange(code);
          setAccessToken(token);
          return;
        }

        if (error === 'auth_failed') {
          console.warn('Auth previously failed, skipping silent auth');
          cleanUrl(['error', 'reason']);
          return;
        }

        const storedToken = getValidStoredToken();
        if (storedToken) {
          setAccessToken(storedToken);
          return;
        }

        const silentToken = await getAccessTokenSilently();
        if (silentToken) {
          setAccessToken(silentToken);
          return;
        }

        const fallbackToken = getValidStoredToken();
        if (fallbackToken) {
          setAccessToken(fallbackToken);
        }
      } catch (err) {
        console.error('Auth init failed:', err);
        clearAuth();
      } finally {
        setIsAuthInitializing(false);
      }
    };

    init();
  }, [
    clearAuth,
    logoutSuccess,
    setAccessToken,
    setIsAuthInitializing,
    code,
    error,
  ]);

  useEffect(() => {
    if (logoutSuccess === 'true') clearAuth();
  }, [clearAuth, logoutSuccess]);

  return null;
}
