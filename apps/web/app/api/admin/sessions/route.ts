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

    // Get sessions active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const sessions = db
      .select()
      .from(schema.activeSessions)
      .where(sql`last_seen > ${fiveMinutesAgo}`)
      .orderBy(sql`last_seen DESC`)
      .all()

    return NextResponse.json({ sessions })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ sessions: [] })
  }
})

