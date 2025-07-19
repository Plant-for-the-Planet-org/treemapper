// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    // Get the upload URL from query parameters or request body
    const { searchParams } = new URL(req.url);
    const uploadUrl = searchParams.get('uploadUrl');
    

    if (!uploadUrl) {
      return NextResponse.json(
        { error: 'Upload URL is required' },
        { status: 400 }
      );
    }

    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer for the upload
    const buffer = await file.arrayBuffer();

    // Make the actual upload request to the presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': file.type,
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'File uploaded successfully',
        status: uploadResponse.status 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      { 
        success:false,
        error: 'Upload failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
