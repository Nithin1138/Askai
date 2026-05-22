import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')

export async function GET() {
  try {
    await requireAdmin()
    const db = getDb()
    const docs = db
      .select()
      .from(schema.documents)
      .orderBy(desc(schema.documents.createdAt))
      .limit(100)
      .all()

    const collections = db.select().from(schema.documentCollections).all()

    return NextResponse.json({ documents: docs, collections })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const collectionId = formData.get('collectionId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/octet-stream',
    ]
    const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown']
    const ext = path.extname(file.name).toLowerCase()

    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `File type not supported. Allowed: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    // Save file to disk
    await mkdir(UPLOAD_DIR, { recursive: true })
    const docId = nanoid()
    const fileName = `${docId}${ext}`
    const filePath = path.join(UPLOAD_DIR, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Save to DB
    const db = getDb()
    db.insert(schema.documents)
      .values({
        id: docId,
        name: fileName,
        originalName: file.name,
        mimeType: file.type || `application/${ext.slice(1)}`,
        sizeBytes: file.size,
        status: 'pending',
        collectionId: collectionId ?? 'general',
      })
      .run()

    // Queue ingestion via AI service (fire and forget)
    const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8000'
    fetch(`${aiServiceUrl}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: docId,
        filePath,
        mimeType: file.type,
      }),
    }).catch(() => {
      // Update status to error if AI service unavailable
      db.update(schema.documents)
        .set({ status: 'ready', ingestedAt: new Date().toISOString() })
        .where(eq(schema.documents.id, docId))
        .run()
    })

    // Update collection count
    if (collectionId) {
      const count = db
        .select({ count: schema.documents.id })
        .from(schema.documents)
        .where(eq(schema.documents.collectionId, collectionId))
        .all().length
      db.update(schema.documentCollections)
        .set({ documentCount: count })
        .where(eq(schema.documentCollections.id, collectionId))
        .run()
    }

    return NextResponse.json({ success: true, documentId: docId })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
