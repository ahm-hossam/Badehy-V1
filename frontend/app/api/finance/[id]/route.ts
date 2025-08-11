import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params
  const res = await fetch(`${BACKEND_URL}/api/finance/${id}`, { method: 'DELETE' })
  const data = await res.json().catch(()=>({}))
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params
  const body = await request.json()
  const res = await fetch(`${BACKEND_URL}/api/finance/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(()=>({}))
  return NextResponse.json(data, { status: res.status })
}


