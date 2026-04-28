// app/api/auth/token/route.ts
import { getSession, getAccessToken } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Create response object first
    const res = new NextResponse();

    // Check if user is authenticated - pass req and res
    const session = await getSession(req, res);

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the access token - pass req and res
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
        error: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: error.status || 500 }
    );
  }
}