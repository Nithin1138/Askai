import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()

    const doc = db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id))
      .get()

    if (!doc || doc.status !== 'ready') {
      return NextResponse.json({ error: 'Document not found or not ready' }, { status: 404 })
    }

    const filePath = path.resolve(process.cwd(), 'uploads', doc.name)
    const fileBuffer = await readFile(filePath)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.originalName)}"`,
      },
    })
  } catch (error) {
    console.error('Failed to view document:', error)
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 })
  }
}
