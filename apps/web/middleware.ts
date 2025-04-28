// middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;
  
  // Get the user session
  const session = await getSession(req, res);
  const isAuthenticated = !!session?.user;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/callback', '/api/auth/logout'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  // Handle login page redirection
  if (path === '/login') {
    if (isAuthenticated) {
      // If authenticated and on login page, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return res; // Allow access to login page if not authenticated
  }
  
  // For API routes and public routes, continue
  if (path.startsWith('/api') || isPublicRoute) {
    return res;
  }
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    const returnTo = encodeURIComponent(path);
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
    /*
     * Match all request paths except:
     * - _next (Next.js internals)
     * - public (static files)
     * - favicon.ico (browser icon)
     * - images (static images)
     */
    '/((?!_next/static|_next/image|fonts|images|favicon.ico|vercel.svg|apple.png|googleplay.png|treemapperLogo.png).*)',
  ],
};