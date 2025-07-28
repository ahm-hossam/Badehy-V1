import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET() {
  try {
    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL}/api/packages`;
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const packages = await response.json();
    return NextResponse.json({
      success: true,
      packages: packages,
      count: packages.length
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch packages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 