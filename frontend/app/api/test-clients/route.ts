import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test the backend connection
    const response = await fetch('http://localhost:3000/api/clients?trainerId=1&page=1&pageSize=10');
    
    if (response.ok) {
      const data = await response.json();
      console.log('Test clients response:', data);
      return NextResponse.json({
        success: true,
        clients: data.clients || data,
        total: data.total || 0
      });
    } else {
      console.error('Backend test failed:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: `Backend returned ${response.status}: ${response.statusText}`
      });
    }
  } catch (error) {
    console.error('Test clients error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to backend'
    });
  }
} 