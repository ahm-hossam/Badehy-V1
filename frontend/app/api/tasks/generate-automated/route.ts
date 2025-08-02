import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = `${BACKEND_URL}/api/tasks/generate-automated`
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error generating automatic tasks:', error)
    return NextResponse.json(
      { error: 'Failed to generate automatic tasks' },
      { status: 500 }
    )
  }
} 