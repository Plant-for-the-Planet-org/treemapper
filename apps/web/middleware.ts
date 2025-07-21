// middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge'; // Use edge version for middleware
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;
  
  // Handle Auth0 callback error for unverified email
  if (path === '/api/auth/callback') {
    const error = req.nextUrl.searchParams.get('error');
    const errorDescription = req.nextUrl.searchParams.get('error_description');
    
    if (error === 'access_denied' && errorDescription === '401') {
      return NextResponse.redirect(new URL('/login?verification=required', req.url));
    }
    
    return res;
  }
  
  if (path.startsWith('/api/auth/logout')) {
    return res;
  }
  
  // Use the edge version and pass both req and res
  const session = await getSession(req, res);
  const isAuthenticated = !!session?.user;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/callback'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  // Handle login page redirection
  if (path === '/login') {
    // CHECK: If coming from logout with federated param, don't redirect
    const fromLogout = req.nextUrl.searchParams.get('federated') !== null;
    
    if (isAuthenticated && !fromLogout) {
      // Check if there's a returnTo parameter to redirect back to
      const returnTo = req.nextUrl.searchParams.get('returnTo');
      const redirectUrl = returnTo ? decodeURIComponent(returnTo) : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return res;
  }
  
  // For API routes and public routes, continue
  if (path.startsWith('/api') || isPublicRoute) {
    return res;
  }
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    // Preserve both pathname and search parameters
    const fullPath = req.nextUrl.pathname + req.nextUrl.search;
    const returnTo = encodeURIComponent(fullPath);
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, req.url));
  }
  
  // Redirect root to dashboard for authenticated users
  if (isAuthenticated && path === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|fonts|images|favicon.ico|vercel.svg|apple.png|googleplay.png|treemapperLogo.png).*)',
  ],
};