import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { withLogging } from '@/lib/db/logs'

export const dynamic = 'force-dynamic'

export const GET = withLogging(async (req: NextRequest) => {
  try {
    await requireAdmin()
    const db = getDb()

    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)
    const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10), 0)

    // Fetch total counts
    const totalRequestsResult = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.requestLogs)
      .get()
    const totalRequests = totalRequestsResult?.count ?? 0

    const totalEventsResult = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.systemEvents)
      .get()
    const totalEvents = totalEventsResult?.count ?? 0

    // Fetch the logs sorted by ID descending (most recent first)
    const requestLogs = db
      .select()
      .from(schema.requestLogs)
      .orderBy(sql`id DESC`)
      .limit(limit)
      .offset(offset)
      .all()

    const systemEvents = db
      .select()
      .from(schema.systemEvents)
      .orderBy(sql`id DESC`)
      .limit(limit)
      .offset(offset)
      .all()

    return NextResponse.json({
      requestLogs,
      systemEvents,
      pagination: {
        limit,
        offset,
        totalRequests,
        totalEvents,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})

export const DELETE = withLogging(async (req: NextRequest) => {
  try {
    await requireAdmin()
    const db = getDb()

    const url = new URL(req.url)
    const type = url.searchParams.get('type') ?? 'all' // 'requests' | 'system' | 'all'

    if (type === 'requests') {
      db.delete(schema.requestLogs).run()
    } else if (type === 'system') {
      db.delete(schema.systemEvents).run()
    } else {
      db.delete(schema.requestLogs).run()
      db.delete(schema.systemEvents).run()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
})
