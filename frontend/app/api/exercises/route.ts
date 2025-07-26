import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trainerId = searchParams.get('trainerId');

  if (!trainerId) {
    return NextResponse.json({ error: 'Missing trainerId' }, { status: 400 });
  }

  try {
    console.log('Fetching exercises from:', `${BACKEND_URL}/api/exercises?trainerId=${trainerId}`);
    const response = await fetch(`${BACKEND_URL}/api/exercises?trainerId=${trainerId}`);
    
    console.log('Response status:', response.status, 'Response ok:', response.ok);
    
    if (!response.ok) {
      // Handle error responses from backend
      const errorData = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('Backend error response:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    console.log('Backend response data:', data, 'Type:', typeof data, 'Is Array:', Array.isArray(data));
    
    // Ensure we always return an array
    if (Array.isArray(data)) {
      return NextResponse.json(data);
    } else {
      console.error('Backend returned non-array data:', data);
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
} 