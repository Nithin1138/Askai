/**
 * AI Provider Abstraction Layer
 * Supports Ollama as primary, with interface for future llama.cpp support
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatOptions {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  maxTokens?: number
}

export interface ModelInfo {
  name: string
  size: number
  digest: string
  modifiedAt: string
  details?: {
    parameterSize?: string
    quantizationLevel?: string
    family?: string
  }
}

export interface AIProvider {
  chat(options: ChatOptions): Promise<Response>
  listModels(): Promise<ModelInfo[]>
  isAvailable(): Promise<boolean>
  pullModel(name: string): Promise<void>
}

// ─── Ollama Provider ──────────────────────────────────────────────────────────

export class OllamaProvider implements AIProvider {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async chat(options: ChatOptions): Promise<Response> {
    const messages = options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    return fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        messages,
        stream: options.stream ?? true,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 2048,
        },
      }),
    })
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return []
      const data = await res.json()
      return (data.models ?? []).map((m: OllamaModel) => ({
        name: m.name,
        size: m.size,
        digest: m.digest,
        modifiedAt: m.modified_at,
        details: {
          parameterSize: m.details?.parameter_size,
          quantizationLevel: m.details?.quantization_level,
          family: m.details?.family,
        },
      }))
    } catch {
      return []
    }
  }

  async pullModel(name: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream: false }),
    })
  }
}

interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
  details?: {
    parameter_size?: string
    quantization_level?: string
    family?: string
  }
}

// ─── Provider Factory ─────────────────────────────────────────────────────────

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!_provider) {
    _provider = new OllamaProvider()
  }
  return _provider
}

// ─── Stream Parser ────────────────────────────────────────────────────────────

/**
 * Parse Ollama streaming response and yield text chunks
 */
export async function* parseOllamaStream(
  response: Response
): AsyncGenerator<string> {
  if (!response.body) return

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.message?.content) {
            yield data.message.content
          }
          if (data.done) return
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
