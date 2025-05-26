// app/api/auth/[...auth0]/route.ts
import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE || 'openid profile email'
    }
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
    // This is the key - federated logout clears Auth0's session
    logoutParams: {
      federated: true
    }
  })
});

export const POST = GET;