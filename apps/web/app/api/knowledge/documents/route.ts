import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const documents = db
      .select({
        id: schema.documents.id,
        originalName: schema.documents.originalName,
        mimeType: schema.documents.mimeType,
        sizeBytes: schema.documents.sizeBytes,
        status: schema.documents.status,
        collectionId: schema.documents.collectionId,
        createdAt: schema.documents.createdAt,
      })
      .from(schema.documents)
      .where(eq(schema.documents.status, 'ready'))
      .orderBy(desc(schema.documents.createdAt))
      .limit(100)
      .all()

    return NextResponse.json({ documents })
  } catch {
    return NextResponse.json({ documents: [] })
  }
}
