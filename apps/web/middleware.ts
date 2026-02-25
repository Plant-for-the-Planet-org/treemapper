// middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;
  
  // Skip auth routes - let them handle their own logic
  if (path.startsWith('/api/auth/')) {
    return res;
  }

  // Skip proxied server routes - mobile app authenticates via Bearer tokens,
  // handled by the NestJS server itself, not this middleware
  if (path.startsWith('/api/server/')) {
    return res;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getSession(req as any, res as any);
  const isAuthenticated = !!session?.user;
  
  // Public routes
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  // Handle login page
  if (path === '/login') {
    if (isAuthenticated) {
      const returnTo = req.nextUrl.searchParams.get('returnTo');
      const redirectUrl = returnTo ? decodeURIComponent(returnTo) : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return res;
  }
  
  // Protect private routes
  if (!isAuthenticated && !isPublicRoute) {
    const fullPath = req.nextUrl.pathname + req.nextUrl.search;
    const returnTo = encodeURIComponent(fullPath);
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, req.url));
  }
  
  // Redirect root to dashboard
  if (isAuthenticated && path === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|fonts|images|favicon.ico|vercel.svg|apple.png|googleplay.png|treemapperLogo.png|\\.well-known).*)',
  ],
};