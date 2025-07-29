import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  console.log('Client details API called for client ID:', clientId);
  
  try {
    // Proxy the request to the backend
    const response = await fetch(`http://localhost:4000/api/clients/${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Backend returned data:', data);
      return NextResponse.json(data);
    } else {
      console.error('Backend API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch client details' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' },
      { status: 500 }
    );
  }
} 