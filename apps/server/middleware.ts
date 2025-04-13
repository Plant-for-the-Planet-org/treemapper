import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );
  
  // Check if the user is on the root path
  const isRootPath = pathname === '/';
  
  // If the user is authenticated and trying to access the root path,
  // redirect them to the dashboard
  if (token && isRootPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the user is authenticated or trying to access a public route, allow access
  if (token || isPublicRoute) {
    return NextResponse.next();
  }
  
  // If the user is not authenticated and trying to access a protected route,
  // redirect them to the login page with the callbackUrl
  const callbackUrl = encodeURIComponent(pathname);
  return NextResponse.redirect(
    new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
  );
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Apply to all routes except for next internal routes and API routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico|api/auth/otp|api/auth/otp/verify).*)',
  ],
};