import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const res = await fetch(`${BACKEND_URL}/api/message-uploads`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Backend error:', text);
      return NextResponse.json({ error: text || 'Failed to upload file' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

