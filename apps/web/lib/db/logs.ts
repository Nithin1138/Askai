import { NextRequest, NextResponse } from 'next/server'
import { getDb } from './client'
import * as schema from './schema'

export interface LogRequestParams {
  path: string
  method: string
  statusCode: number
  durationMs?: number | null
  ip?: string | null
  userAgent?: string | null
}

export function logRequest(params: LogRequestParams) {
  try {
    const db = getDb()
    db.insert(schema.requestLogs)
      .values({
        path: params.path,
        method: params.method,
        statusCode: params.statusCode,
        durationMs: params.durationMs ?? null,
        ip: params.ip ?? '127.0.0.1',
        userAgent: params.userAgent ?? 'Unknown',
      })
      .run()
  } catch (error) {
    console.error('Failed to write request log:', error)
  }
}

export interface LogSystemEventParams {
  type: string
  payload?: any
  severity?: 'info' | 'warning' | 'error'
}

export function logSystemEvent(params: LogSystemEventParams) {
  try {
    const db = getDb()
    db.insert(schema.systemEvents)
      .values({
        type: params.type,
        payload: params.payload ? JSON.stringify(params.payload) : null,
        severity: params.severity ?? 'info',
      })
      .run()
  } catch (error) {
    console.error('Failed to write system event:', error)
  }
}

/**
 * Higher-order function to wrap API route handlers with request logging.
 */
export function withLogging(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest, ctx: any) => {
    const startTime = Date.now()
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const path = req.nextUrl.pathname
    const method = req.method

    try {
      const response = await handler(req, ctx)
      const durationMs = Date.now() - startTime
      logRequest({
        path,
        method,
        statusCode: response.status,
        durationMs,
        ip,
        userAgent,
      })
      return response
    } catch (error) {
      const durationMs = Date.now() - startTime
      logRequest({
        path,
        method,
        statusCode: 500,
        durationMs,
        ip,
        userAgent,
      })
      throw error
    }
  }
}
