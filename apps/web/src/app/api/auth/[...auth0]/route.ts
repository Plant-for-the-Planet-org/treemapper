// app/api/auth/[...auth0]/route.ts
import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

// Create the auth handler with configuration
const authHandler = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE || 'openid profile email'
    }
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
    logoutParams: {
      federated: true
    }
  })
});

// Create async wrapper for GET requests
async function GET(req: NextRequest, context: { params: Promise<any> }) {
  // Await the params to comply with Next.js 15
  const resolvedParams = await context.params;
  
  // Call the auth handler with resolved params
  return authHandler(req, { params: resolvedParams });
}

// Create async wrapper for POST requests
async function POST(req: NextRequest, context: { params: Promise<any> }) {
  // Await the params to comply with Next.js 15
  const resolvedParams = await context.params;
  
  // Call the auth handler with resolved params
  return authHandler(req, { params: resolvedParams });
}

export { GET, POST };