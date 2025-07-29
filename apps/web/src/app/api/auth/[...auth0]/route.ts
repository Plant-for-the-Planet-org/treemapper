// app/api/auth/[...auth0]/route.ts
import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

const authHandler = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE || 'openid profile email'
    }
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL || 'http://localhost:3000'
  })
});

export async function GET(req: NextRequest, context: { params: Promise<{ auth0: string[] }> }) {
  try {
    const resolvedParams = await context.params;
    return authHandler(req, { params: resolvedParams });
  } catch (error) {
    console.error('Auth handler error:', error);
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