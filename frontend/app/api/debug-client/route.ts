import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get client 66 data from backend
    const response = await fetch('http://localhost:3000/api/clients/66');
    
    if (response.ok) {
      const data = await response.json();
      console.log('=== DEBUG CLIENT 66 DATA ===');
      console.log('Full client data:', JSON.stringify(data, null, 2));
      console.log('selectedFormId:', data.selectedFormId);
      console.log('submissions:', data.submissions);
      console.log('latestSubmission:', data.latestSubmission);
      console.log('answers:', data.latestSubmission?.answers);
      console.log('form:', data.latestSubmission?.form);
      console.log('=== END DEBUG ===');
      
      return NextResponse.json({
        success: true,
        data: data
      });
    } else {
      console.error('Backend error:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: `Backend returned ${response.status}`
      });
    }
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch client data'
    });
  }
} 