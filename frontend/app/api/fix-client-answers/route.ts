import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This is a temporary fix to add missing answers for client 66
    const response = await fetch('http://localhost:3000/api/clients/66', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client: {
          selectedFormId: 16 // Keep the same form ID
        },
        answers: {
          "111": "Ahmed Hossam", // Full Name
          "112": "01287235491",  // Mobile Number
          "filledByTrainer": true
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: "Client answers updated successfully",
        data: data
      });
    } else {
      console.error('Failed to update client answers:', response.status);
      return NextResponse.json({
        success: false,
        error: `Failed to update client answers: ${response.status}`
      });
    }
  } catch (error) {
    console.error('Fix client answers error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix client answers'
    });
  }
} 