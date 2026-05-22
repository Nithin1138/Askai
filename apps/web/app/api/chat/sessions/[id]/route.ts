import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()

    const session = db
      .select()
      .from(schema.chatSessions)
      .where(eq(schema.chatSessions.id, id))
      .get()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const messages = db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.sessionId, id))
      .orderBy(schema.chatMessages.createdAt)
      .all()

    return NextResponse.json({ session, messages })
  } catch {
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    db.delete(schema.chatSessions).where(eq(schema.chatSessions.id, id)).run()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
