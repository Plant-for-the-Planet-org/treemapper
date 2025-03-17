// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of paths that don't require authentication
const publicPaths = ['/login', '/register', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check for the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL('/login', request.url);
    // Add the current path as a callback URL to redirect after login
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Apply to all paths except public ones and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};