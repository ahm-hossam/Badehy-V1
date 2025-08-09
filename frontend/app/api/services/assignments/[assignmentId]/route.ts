import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function PATCH(request: NextRequest, { params }: { params: { assignmentId: string } }) {
  const body = await request.json()
  const res = await fetch(`${BACKEND_URL}/api/services/assignments/${params.assignmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(request: NextRequest, { params }: { params: { assignmentId: string } }) {
  const res = await fetch(`${BACKEND_URL}/api/services/assignments/${params.assignmentId}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}


