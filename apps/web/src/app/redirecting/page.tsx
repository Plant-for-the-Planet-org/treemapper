'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clearOAuthState, getStoredOAuthState } from '@/lib/auth/oauth-state';
import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth';
import { cleanUrl, getSafeRedirectPath } from '@/lib/utils/auth';
import { useAuthStore } from '@/stores/auth-store';
import Spinner from '@/component/Spinner';

function RedirectingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirectTo');
  const logoutSuccess = searchParams.get('logoutSuccess');
  const safeRedirectPath = getSafeRedirectPath(redirectPath);
  const nonce = searchParams.get('state');
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  useEffect(() => {
    if (nonce) {
      if (isAuthInitializing) return;

      cleanUrl(['state']);
      const redirectTo = getStoredOAuthState(nonce) ?? DEFAULT_REDIRECT_PATH;

      clearOAuthState(nonce);

      router.replace(redirectTo);
      return;
    }

    if (logoutSuccess === 'true') {
      router.replace(safeRedirectPath);
    }
  }, [logoutSuccess, router, safeRedirectPath, nonce, isAuthInitializing]);

  const label = nonce
    ? 'Signing you in...'
    : logoutSuccess === 'true'
      ? 'Signing you out...'
      : 'Redirecting...';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner />
      <p className="text-sm text-neutral-700">{label}</p>
    </div>
  );
}

export default function RedirectingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <RedirectingInner />
    </Suspense>
  );
}
