import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get client 66 data from backend
    const response = await fetch('http://localhost:3000/api/clients/66');
    
    if (response.ok) {
      const data = await response.json();
      console.log('=== DEBUG CLIENT 66 ANSWERS ===');
      console.log('Client ID:', data.id);
      console.log('Selected Form ID:', data.selectedFormId);
      console.log('Latest Submission:', data.latestSubmission);
      console.log('Submissions:', data.submissions);
      console.log('Answers from latestSubmission:', data.latestSubmission?.answers);
      console.log('Answers keys:', data.latestSubmission?.answers ? Object.keys(data.latestSubmission.answers) : 'No answers');
      console.log('Form from latestSubmission:', data.latestSubmission?.form);
      console.log('=== END DEBUG ===');
      
      return NextResponse.json({
        success: true,
        client: {
          id: data.id,
          selectedFormId: data.selectedFormId,
          latestSubmission: data.latestSubmission,
          submissions: data.submissions,
          answers: data.latestSubmission?.answers,
          answersKeys: data.latestSubmission?.answers ? Object.keys(data.latestSubmission.answers) : [],
          form: data.latestSubmission?.form
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
    console.error('Debug answers error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch client data'
    });
  }
} 