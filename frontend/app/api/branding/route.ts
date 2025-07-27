import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Frontend branding API called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    console.log('Backend URL:', backendUrl);
    
    const response = await fetch(`${backendUrl}/api/branding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }
  } catch (error) {
    console.error('Error in branding API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 