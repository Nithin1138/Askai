import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/provider'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import os from 'os'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const provider = getAIProvider()
    const [modelAvailable, models] = await Promise.all([
      provider.isAvailable(),
      provider.listModels().catch(() => []),
    ])

    const db = getDb()

    // Get document count
    let documentsCount = 0
    try {
      const result = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.documents)
        .where(sql`status = 'ready'`)
        .get()
      documentsCount = result?.count ?? 0
    } catch {}

    // Get active user count (seen in last 5 minutes)
    let activeUsers = 0
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const result = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.activeSessions)
        .where(sql`last_seen > ${fiveMinutesAgo}`)
        .get()
      activeUsers = result?.count ?? 0
    } catch {}

    const defaultModel =
      process.env.DEFAULT_CHAT_MODEL ?? 'gemma3:1b'
    const currentModel = models[0]?.name ?? defaultModel

    return NextResponse.json({
      modelAvailable,
      modelName: currentModel,
      models: models.map((m) => m.name),
      modelsInstalled: models.length,
      activeUsers,
      documentsCount,
      deviceName: process.env.NEXT_PUBLIC_DEVICE_NAME ?? os.hostname(),
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        modelAvailable: false,
        modelName: 'Unknown',
        activeUsers: 0,
        documentsCount: 0,
        deviceName: process.env.NEXT_PUBLIC_DEVICE_NAME ?? 'ASKAI Hub',
        error: 'Status check failed',
      },
      { status: 200 } // Always 200 — let clients handle partial data
    )
  }
}
