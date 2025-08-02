import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backendUrl = `${BACKEND_URL}/api/tasks/count?${searchParams.toString()}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching task count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task count' },
      { status: 500 }
    )
  }
} 