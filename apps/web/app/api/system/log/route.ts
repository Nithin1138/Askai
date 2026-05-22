import { NextRequest, NextResponse } from 'next/server'
import { logRequest } from '@/lib/db/logs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    logRequest({
      path: data.path,
      method: data.method,
      statusCode: data.statusCode,
      durationMs: data.durationMs,
      ip: data.ip,
      userAgent: data.userAgent,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
