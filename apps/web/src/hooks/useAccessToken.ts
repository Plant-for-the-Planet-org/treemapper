// hooks/useAccessToken.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export function useAccessToken() {
  const { user, error: userError, isLoading: userLoading } = useUser();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccessToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to fetch access token: ${response.status} ${errorData.error || ''}`);
      }

      const data = await response.json();

      if (!data.accessToken) {
        throw new Error('No access token returned from the API');
      }

      setAccessToken(data.accessToken);
    } catch (err: any) {
      console.error('Access token error:', err);
      setError(err);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only attempt to get the token if the user is logged in
    if (userLoading) {
      return;
    }

    if (userError) {
      console.error('User error:', userError);
      setError(userError);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setAccessToken(null);
      setIsLoading(false);
      return; // Don't attempt to fetch token if not logged in
    }

    fetchAccessToken();
  }, [user, userLoading, userError, fetchAccessToken]);

  // Provide a refresh function for manual token refresh
  const refreshToken = useCallback(() => {
    if (user && !userLoading) {
      fetchAccessToken();
    }
  }, [user, userLoading, fetchAccessToken]);

  return {
    accessToken: accessToken || '',
    tokenLoading: isLoading || userLoading,
    tokenError: error || userError,
    user,
    refreshToken
  };
}