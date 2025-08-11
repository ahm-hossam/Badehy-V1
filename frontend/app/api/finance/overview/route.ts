import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const qs = url.searchParams.toString()
  const res = await fetch(`${BACKEND_URL}/api/finance/overview?${qs}`)
  const data = await res.json().catch(()=>({}))
  return NextResponse.json(data, { status: res.status })
}


