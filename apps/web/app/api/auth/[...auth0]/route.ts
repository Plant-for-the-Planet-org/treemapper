// app/api/auth/[...auth0]/route.ts
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

// Set up Auth0 routes
export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      // Replace with your API identifier if you have one
      audience: process.env.AUTH0_AUDIENCE,
      // Add the scopes you need
      scope: process.env.AUTH0_SCOPE || 'openid profile email'
    }
  })
});

// This is necessary for Auth0 to handle all HTTP methods
export const POST = GET;