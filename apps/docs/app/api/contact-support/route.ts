import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const subject = formData.get('subject') as string;
    const category = formData.get('category') as string;
    const message = formData.get('message') as string;

    // Validate required fields
    if (!name || !email || !subject || !category || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Collect files
    const files: { name: string; size: number; type: string }[] = [];
    let fileIndex = 0;
    while (formData.has(`file_${fileIndex}`)) {
      const file = formData.get(`file_${fileIndex}`) as File;
      if (file) {
        files.push({
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }
      fileIndex++;
    }

    // Here you would typically:
    // 1. Send an email to the support team with the form data
    // 2. Store the submission in a database
    // 3. Upload files to cloud storage if needed
    // 4. Send a confirmation email to the user

    // For now, we'll just log the data and return success
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      category,
      message,
      files: files.map((f) => f.name),
      timestamp: new Date().toISOString(),
    });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(
      {
        success: true,
        message: 'Your request has been submitted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again later.' },
      { status: 500 }
    );
  }
}
