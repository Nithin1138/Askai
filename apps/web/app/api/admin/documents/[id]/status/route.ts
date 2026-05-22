import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Called by AI service to update document status after ingestion
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
        const { id } = await params
    const { status, error, chunkCount, chunks } = await req.json()

    const db = getDb()
    db.update(schema.documents)
      .set({
        status: status ?? 'ready',
        errorMessage: error ?? null,
        chunkCount: chunkCount ?? 0,
        ingestedAt: status === 'ready' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.documents.id, id))
      .run()

    if (status === 'ready' && Array.isArray(chunks)) {
      try {
        // Clean up any existing chunks (re-ingest safety)
        db.delete(schema.documentChunks).where(eq(schema.documentChunks.documentId, id)).run()

        // Bulk insert
        db.transaction((tx) => {
          for (const chunk of chunks) {
            tx.insert(schema.documentChunks)
              .values({
                id: `${id}_${chunk.index}`,
                documentId: id,
                content: chunk.content,
                chunkIndex: chunk.index,
                metadata: JSON.stringify({ documentId: id }),
              })
              .run()
          }
        })
      } catch (err) {
        console.error('Error inserting document chunks:', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH document status error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
