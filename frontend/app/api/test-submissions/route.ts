import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test the backend connection to get submissions for client 66
    const response = await fetch('http://localhost:4000/api/clients/66');
    
    if (response.ok) {
      const data = await response.json();
      console.log('=== DEBUG CLIENT 66 SUBMISSIONS ===');
      console.log('Client data:', {
        id: data.id,
        fullName: data.fullName,
        selectedFormId: data.selectedFormId,
        submissions: data.submissions,
        latestSubmission: data.latestSubmission,
        submissionsCount: data.submissions?.length || 0
      });
      console.log('=== END DEBUG ===');
      
      return NextResponse.json({
        success: true,
        client: {
          id: data.id,
          fullName: data.fullName,
          selectedFormId: data.selectedFormId,
          submissions: data.submissions,
          latestSubmission: data.latestSubmission,
          submissionsCount: data.submissions?.length || 0
        }
      });
    } else {
      console.error('Backend error:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: `Backend returned ${response.status}`
      });
    }
  } catch (error) {
    console.error('Test submissions error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch client data'
    });
  }
} 