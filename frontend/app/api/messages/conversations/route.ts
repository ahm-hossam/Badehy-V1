import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trainerId = searchParams.get('trainerId');

    if (!trainerId) {
      return NextResponse.json({ error: 'trainerId is required' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/messages/conversations?trainerId=${trainerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Backend error:', text);
      return NextResponse.json({ error: text || 'Failed to fetch conversations' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

