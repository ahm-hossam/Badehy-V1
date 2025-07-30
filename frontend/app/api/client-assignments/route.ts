import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const clientId = searchParams.get('clientId');
    const teamMemberId = searchParams.get('teamMemberId');

    if (!trainerId) {
      return NextResponse.json({ error: 'Trainer ID is required' }, { status: 400 });
    }

    let url = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/client-assignments?trainerId=${trainerId}`;
    if (clientId) url += `&clientId=${clientId}`;
    if (teamMemberId) url += `&teamMemberId=${teamMemberId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching client assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch client assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/api/client-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating client assignment:', error);
    return NextResponse.json({ error: 'Failed to create client assignment' }, { status: 500 });
  }
} 