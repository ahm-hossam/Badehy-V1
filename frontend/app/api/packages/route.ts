import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const search = searchParams.get('search') || '';

    if (!trainerId) {
      return NextResponse.json({ error: 'Trainer ID is required' }, { status: 400 });
    }

    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL}/api/packages?trainerId=${trainerId}&search=${encodeURIComponent(search)}`;
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const packages = await response.json();
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trainerId, name, durationValue, durationUnit, priceBeforeDisc } = body || {};

    if (!trainerId || !name || durationValue === undefined || !durationUnit || priceBeforeDisc === undefined) {
      return NextResponse.json({ error: 'Trainer ID, name, duration, and price are required' }, { status: 400 });
    }

    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL}/api/packages`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Forward full payload (includes discount data etc.)
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const newPackage = await response.json();
    return NextResponse.json(newPackage);
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
} 