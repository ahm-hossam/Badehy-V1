import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const formData = await request.formData();
    
    const response = await fetch(`http://localhost:4000/api/templates/${params.templateId}/pages`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to add page' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 