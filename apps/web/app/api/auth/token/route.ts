// app/api/auth/token/route.ts
import { getSession, getAccessToken } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Create a new response object
    const res = new NextResponse();
    
    // Get the access token
    const { accessToken } = await getAccessToken(req, res);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ accessToken });
  } catch (error: any) {
    console.error('Access token error:', error);
    
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code 
      },
      { status: error.status || 500 }
    );
  }
}