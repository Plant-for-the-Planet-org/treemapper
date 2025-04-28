// app/api/auth/[auth0]/route.ts
import { handleAuth, handleLogin, handleCallback } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

// Custom login handler to support returnTo functionality
const customHandleLogin = (req: NextRequest) => {
  const returnTo = req.nextUrl.searchParams.get('returnTo');
  
  return handleLogin({
    returnTo: returnTo || '/dashboard',
    authorizationParams: {
      // Additional parameters if needed
    }
  })(req);
};

// Custom callback handler
const customHandleCallback = (req: NextRequest) => {
  return handleCallback({
    afterCallback: (_, __, session) => {
      return session;
    },
  })(req);
};

export const GET = handleAuth({
  login: customHandleLogin,
  callback: customHandleCallback
});

export const POST = handleAuth();