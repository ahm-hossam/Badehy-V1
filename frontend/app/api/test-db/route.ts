import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test the backend directly
    const response = await fetch('http://localhost:3000/api/clients?trainerId=8');
    const clients = await response.json();
    
    console.log('=== DATABASE TEST ===');
    console.log('Raw clients data:', JSON.stringify(clients, null, 2));
    
    // Check the first client's structure
    if (clients && clients.length > 0) {
      const firstClient = clients[0];
      console.log('First client fullName:', firstClient.fullName);
      console.log('First client structure:', Object.keys(firstClient));
    }
    
    return NextResponse.json({
      success: true,
      clientCount: clients?.length || 0,
      firstClient: clients?.[0] || null,
      message: "Check server console for detailed data"
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 