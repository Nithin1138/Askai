import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { withLogging } from '@/lib/db/logs'

export const dynamic = 'force-dynamic'

export const GET = withLogging(async (req: NextRequest) => {
  try {
    await requireAdmin()
    const db = getDb()
    const rows = db.select().from(schema.settings).all()
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ settings: {} })
  }
})

export const POST = withLogging(async (req: NextRequest) => {
  try {
    await requireAdmin()
    const { settings } = await req.json()
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings' }, { status: 400 })
    }

    const db = getDb()
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'string') continue
      db.insert(schema.settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: schema.settings.key,
          set: { value, updatedAt: new Date().toISOString() },
        })
        .run()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
})

