import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const sessions = db
      .select()
      .from(schema.chatSessions)
      .where(eq(schema.chatSessions.isArchived, false))
      .orderBy(desc(schema.chatSessions.updatedAt))
      .limit(50)
      .all()

    return NextResponse.json(sessions)
  } catch {
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  }
}
