import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params
    const res = await fetch(`${BACKEND_URL}/api/clients/profile/${id}`)
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}


