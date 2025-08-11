import { NextRequest, NextResponse } from 'next/server'

// Use the same env var as other API proxies for consistency
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

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

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching task count:', error)
    return NextResponse.json({ error: 'Failed to fetch task count' }, { status: 500 })
  }
} 