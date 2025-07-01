// hooks/useAccessToken.ts
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export function useAccessToken() {
  const { user, error: userError, isLoading: userLoading } = useUser();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only attempt to get the token if the user is logged in
    if (userLoading) return;
    
    if (userError) {
      console.error('User error:', userError);
      setError(userError);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setIsLoading(false);
      return; // Don't attempt to fetch token if not logged in
    }

    const fetchAccessToken = async () => {
      try {
        setIsLoading(true);
        
        // Use the /api/auth/token endpoint instead of /api/auth/access-token
        const response = await fetch('/api/auth/token');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessToken();
  }, [user, userLoading, userError]);

  return { 
    accessToken, 
    tokenLoading: isLoading || userLoading, 
    tokenError: error || userError,
    user 
  };
}