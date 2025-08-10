import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, trainerId } = body as {
      name?: string
      email?: string
      subject?: string
      message?: string
      trainerId?: number
    };

    // Proxy to backend support route to reuse server DB access
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'
    const resp = await fetch(`${BACKEND_URL}/api/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message, trainerId }),
    })
    const data = await resp.json().catch(() => ({}))
    return NextResponse.json(data, { status: resp.status })
  } catch (error) {
    console.error('Error processing support request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}