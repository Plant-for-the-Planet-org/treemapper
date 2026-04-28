// app/providers/Auth0Provider.tsx
'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import React from 'react';

interface Auth0ProviderProps {
  children: React.ReactNode;
}

export default function Auth0Provider({ children }: Auth0ProviderProps) {
  return (
    <UserProvider
      // Add any additional configuration if needed
      user={undefined} // Let Auth0 handle user fetching
      profileUrl="/api/auth/me" // Default profile endpoint
      loginUrl="/api/auth/login" // Default login endpoint
    >
      {children}
    </UserProvider>
  );
}