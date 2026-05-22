import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAIProvider, parseOllamaStream } from '@/lib/ai/provider'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  sessionId: z.string().optional(),
  model: z.string().optional(),
  useRag: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, sessionId, model, useRag } = chatSchema.parse(body)

    const db = getDb()
    const provider = getAIProvider()

    // Check if Ollama is available
    const available = await provider.isAvailable()
    if (!available) {
      return new Response(
        JSON.stringify({ error: 'AI model is not available. Please ensure Ollama is running.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get or create session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      currentSessionId = nanoid()
      const title = message.slice(0, 60) + (message.length > 60 ? '…' : '')
      db.insert(schema.chatSessions)
        .values({
          id: currentSessionId,
          title,
          model: model ?? process.env.DEFAULT_CHAT_MODEL ?? 'gemma3:1b',
        })
        .run()
    }

    // Load message history for context
    const history = db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.sessionId, currentSessionId))
      .orderBy(schema.chatMessages.createdAt)
      .limit(20)
      .all()

    // Save user message
    const userMsgId = nanoid()
    db.insert(schema.chatMessages)
      .values({
        id: userMsgId,
        sessionId: currentSessionId,
        role: 'user',
        content: message,
      })
      .run()

    // Retrieve RAG context if enabled
    let sources: any[] = []
    let systemPrompt = 'You are ASKAI, a helpful local AI assistant. You run privately on a local network — no internet connection is used. Be concise, accurate, and helpful. If you are unsure, say so.'

    if (useRag) {
      try {
        const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8000'
        const retrieveRes = await fetch(`${aiServiceUrl}/embed/retrieve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: message,
            topK: 4,
          }),
        })
        if (retrieveRes.ok) {
          const data = await retrieveRes.json()
          if (Array.isArray(data.results) && data.results.length > 0) {
            // Format sources for citations
            sources = data.results.map((r: any) => ({
              documentId: r.metadata?.document_id,
              name: r.metadata?.source || 'Unknown source',
              chunkIndex: r.metadata?.chunk_index,
              contentSnippet: r.content.slice(0, 150) + (r.content.length > 150 ? '...' : ''),
            }))

            // Build context string
            const contextText = data.results.map((r: any, idx: number) => {
              return `[Source ${idx + 1}: ${r.metadata?.source || 'Unknown'}]\n${r.content}`
            }).join('\n\n')

            // Enhance system prompt with context
            systemPrompt = `You are ASKAI, a helpful offline AI assistant. You have access to local documents to help answer the user's questions.
Use the following retrieved context to answer the user's question. If the context does not contain enough information to answer the question, rely on your general knowledge but clearly state that the local documents did not contain the answer.
Keep your answer factual and structured. Cite the sources where appropriate using [Source X] format.

Retrieved Context:
${contextText}

Remember: Run 100% locally and privately.`
          }
        }
      } catch (err) {
        console.error('Failed to retrieve RAG context:', err)
      }
    }

    // Build messages array for Ollama
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const chatModel = model ?? process.env.DEFAULT_CHAT_MODEL ?? 'gemma3:1b'

    // Call AI provider
    const ollamaResponse = await provider.chat({
      model: chatModel,
      messages,
      stream: true,
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama error: ${ollamaResponse.status}`)
    }

    // Create streaming response (SSE)
    const assistantMsgId = nanoid()
    let fullContent = ''

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        // Send session ID first so client can track it
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'session', sessionId: currentSessionId })}\n\n`
          )
        )

        // Send citations sources if RAG was used and sources were found
        if (useRag && sources.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'sources', sources })}\n\n`
            )
          )
        }

        try {
          for await (const chunk of parseOllamaStream(ollamaResponse)) {
            fullContent += chunk
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
              )
            )
          }

          // Save assistant message to DB
          db.insert(schema.chatMessages)
            .values({
              id: assistantMsgId,
              sessionId: currentSessionId!,
              role: 'assistant',
              content: fullContent,
              sources: sources.length > 0 ? JSON.stringify(sources) : null,
            })
            .run()

          // Update session message count
          db.update(schema.chatSessions)
            .set({
              messageCount: sql`message_count + 2`,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.chatSessions.id, currentSessionId!))
            .run()

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'done', sessionId: currentSessionId })}\n\n`
            )
          )
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Session-Id': currentSessionId,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid request', details: error.issues }, { status: 400 })
    }
    console.error('Chat error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
