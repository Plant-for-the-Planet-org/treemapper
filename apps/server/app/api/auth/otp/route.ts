// src/app/api/auth/otp/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }
    
    // Forward the request to the actual OTP endpoint
    const response = await fetch(`${apiUrl}/auth/otp/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
      redirect: 'follow', // Handle redirects automatically
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response from the external API
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json(
      { error: 'Failed to request OTP' },
      { status: 500 }
    );
  }
}