// app/api/auth/[...auth0]/route.ts
import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

// Create the logout URL that clears Auth0 session completely
const logoutUrl = [
  `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?`,
  `client_id=${process.env.AUTH0_CLIENT_ID}`,
  `&returnTo=${encodeURIComponent(process.env.AUTH0_BASE_URL || 'http://localhost:3000')}`,
].join('');

const authHandler = handleAuth({
  login: handleLogin((req) => {
    const url = new URL(req.url);
    const connection = url.searchParams.get('connection');

    return {
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        scope: process.env.AUTH0_SCOPE || 'openid profile email',
        ...(connection && { connection })
      }
    };
  }),
  // Use federated logout to clear both local and Auth0 sessions
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL || 'http://localhost:3000'
  }),
  callback: handleCallback({
    afterCallback: async (req, session, state) => {
      // This only runs on successful authentication
      return session;
    },
    // Handle callback errors
    onError: async (req, error) => {
      console.error('Auth0 callback error:', error);

      // Check if it's an email verification error
      const url = new URL(req.url);
      const authError = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (authError === 'access_denied' && errorDescription === '401') {
        // Redirect to login with verification required parameter
        return NextResponse.redirect(
          new URL('/login?verification=required', process.env.AUTH0_BASE_URL)
        );
      }

      // For other errors, redirect to login with generic error
      return NextResponse.redirect(
        new URL('/login?error=authentication_failed', process.env.AUTH0_BASE_URL)
      );
    }
  })
});

export async function GET(req: NextRequest, context: { params: Promise<{ auth0: string[] }> }) {
  try {
    const resolvedParams = await context.params;

    // Pre-check for callback errors before they hit the Auth0 handler
    if (resolvedParams.auth0.includes('callback')) {
      const url = new URL(req.url);
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (error === 'access_denied' && errorDescription === '401') {
        return NextResponse.redirect(
          new URL('/login?verification=required', process.env.AUTH0_BASE_URL)
        );
      }
    }

    return authHandler(req, { params: resolvedParams });
  } catch (error) {
    console.error('Auth handler error:', error);

    // Last resort error handling
    const url = new URL(req.url);
    const authError = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (authError === 'access_denied' && errorDescription === '401') {
      return NextResponse.redirect(
        new URL('/login?verification=required', process.env.AUTH0_BASE_URL)
      );
    }

    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ auth0: string[] }> }) {
  try {
    const resolvedParams = await context.params;
    return authHandler(req, { params: resolvedParams });
  } catch (error) {
    console.error('Auth handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}