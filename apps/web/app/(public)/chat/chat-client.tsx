'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Square,
  RotateCcw,
  Copy,
  Check,
  MessageSquare,
  Cpu,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  ExternalLink,
  Search,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn, formatBytes } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: {
    documentId: string
    name: string
    chunkIndex?: number
    contentSnippet?: string
  }[]
}

interface Document {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  status: string
  collectionId: string | null
  createdAt: string
}

const PROMPTS = [
  'Explain this concept simply: quantum computing',
  'Write a lesson plan for teaching fractions to grade 5',
  'What are the key safety rules for a science lab?',
  'Summarize the importance of clean water access',
]

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [useRag, setUseRag] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelName, setModelName] = useState<string>('gemma3:1b')
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  // Knowledge Base sidebar states
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check model and status on mount
  useEffect(() => {
    fetch('/api/system/status')
      .then((r) => r.json())
      .then((data) => {
        setModelAvailable(data.modelAvailable)
        setModelName(data.modelName ?? 'gemma3:1b')
        setAvailableModels(data.models ?? [])
      })
      .catch(() => setModelAvailable(false))

    // Fetch documents
    fetch('/api/knowledge/documents')
      .then((r) => r.json())
      .then((data) => {
        setDocuments(data.documents ?? [])
      })
      .catch(() => {})
      .finally(() => setDocumentsLoading(false))
  }, [])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim()
      if (!content || isStreaming) return

      setInput('')
      setError(null)

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      const abort = new AbortController()
      abortRef.current = abort

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, sessionId, model: modelName, useRag }),
          signal: abort.signal,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error ?? 'Request failed')
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'session' && data.sessionId) {
                setSessionId(data.sessionId)
              }
              if (data.type === 'sources' && Array.isArray(data.sources)) {
                const docSources = data.sources
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, sources: docSources } : m
                  )
                )
              }
              if (data.type === 'chunk' && data.content) {
                fullContent += data.content
                const captured = fullContent
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: captured } : m
                  )
                )
              }
              if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (parseErr) {
              // Skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const msg = (err as Error).message
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id))
      } finally {
        setIsStreaming(false)
        abortRef.current = null
        textareaRef.current?.focus()
      }
    },
    [input, isStreaming, sessionId, modelName, useRag]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  const handleNewChat = () => {
    setMessages([])
    setSessionId(undefined)
    setError(null)
    textareaRef.current?.focus()
  }

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Sidebar component content
  const renderSidebarContent = () => {
    const filteredSidebarDocs = documents.filter((doc) =>
      doc.originalName.toLowerCase().includes(sidebarSearch.toLowerCase())
    )

    return (
      <div className="flex flex-col h-full bg-[hsl(var(--surface))] select-none">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[hsl(var(--accent))]" />
            <h3 className="font-semibold text-sm">Knowledge Base</h3>
          </div>
          <Badge variant="muted" className="text-[10px]">
            {documents.length} Total
          </Badge>
        </div>

        {/* Sidebar Search */}
        <div className="p-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Search documents..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="pl-8.5 h-8 text-xs"
            />
          </div>
        </div>

        {/* Sidebar Files List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {documentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-full bg-[hsl(var(--muted))] animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredSidebarDocs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {sidebarSearch ? 'No files match your search' : 'No documents uploaded yet'}
              </p>
            </div>
          ) : (
            filteredSidebarDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => window.open(`/api/knowledge/documents/${doc.id}`, '_blank')}
                className="flex items-start gap-2.5 rounded-lg border border-[hsl(var(--border))] p-2.5 hover:border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--surface-hover))] cursor-pointer transition-all group"
              >
                <div className="h-7 w-7 rounded bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0 mt-0.5 animate-in fade-in zoom-in-95 duration-150">
                  <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate group-hover:text-[hsl(var(--accent))] transition-colors">
                    {doc.originalName}
                  </p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    {formatBytes(doc.sizeBytes)}
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)] w-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[hsl(var(--background))] h-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.95)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all duration-200',
                modelAvailable === true
                  ? 'border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] hover:border-[hsl(var(--success)/0.5)]'
                  : modelAvailable === false
                  ? 'border-[hsl(var(--error)/0.3)] bg-[hsl(var(--error-subtle))] text-[hsl(var(--error))]'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              )}
            >
              <Cpu className="h-3 w-3" />
              {modelAvailable === true && availableModels.length > 0 ? (
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="bg-transparent text-[11px] font-semibold border-none outline-none cursor-pointer pr-1 focus:ring-0 text-[hsl(var(--success))] select-none"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m} className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans font-medium text-xs">
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px] font-semibold">{modelName}</span>
              )}
              {modelAvailable === true && (
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              )}
            </div>
            <Badge variant="muted" className="text-[10px]">
              Local only
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant={isSidebarOpen ? "accent-subtle" : "ghost"}
              size="icon-sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Knowledge base documents"
              className={cn(
                "relative",
                isSidebarOpen && "bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent))]"
              )}
            >
              <BookOpen className="h-4 w-4" />
              {documents.length > 0 && !isSidebarOpen && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
              )}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleNewChat} title="New chat">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--accent-subtle))] flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-[hsl(var(--accent))]" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Ask anything</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-8 max-w-sm">
                  Your conversations stay on this device. No data is sent to the cloud.
                </p>
                {modelAvailable === false && (
                  <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning-subtle))] px-4 py-2.5 text-sm text-[hsl(var(--warning))] mb-6">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Ollama is not running. Start it with: <code className="font-mono ml-1">ollama serve</code>
                  </div>
                )}
                {/* Prompt suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSubmit(prompt)}
                      className="text-left rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2.5 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">AI</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      'group relative max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-[hsl(var(--accent))] text-white rounded-tr-sm'
                        : 'bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-tl-sm'
                    )}
                  >
                    {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                      <span className="flex gap-1 items-center py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce [animation-delay:300ms]" />
                      </span>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[hsl(var(--border))] space-y-1.5">
                            <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-[hsl(var(--accent))]" />
                              <span>Sources</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.documentId ? `/api/knowledge/documents/${src.documentId}` : '/knowledge'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={src.contentSnippet || src.name}
                                  className="flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-0.5 border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent))] hover:border-[hsl(var(--accent)/0.3)] hover:bg-[hsl(var(--accent-subtle))] transition-all duration-150"
                                >
                                  <span className="text-[9px] px-1 py-px rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-bold">
                                    {sIdx + 1}
                                  </span>
                                  <span className="truncate max-w-[120px]">{src.name}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Copy button */}
                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3 w-3 text-[hsl(var(--success))]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-[hsl(var(--error)/0.3)] bg-[hsl(var(--error-subtle))] px-4 py-3 text-sm text-[hsl(var(--error))]"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-[hsl(var(--error)/0.7)] hover:text-[hsl(var(--error))]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.95)] backdrop-blur-md px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {/* Controls above input */}
            <div className="flex items-center justify-between mb-2.5">
              <button
                onClick={() => setUseRag(!useRag)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs border transition-all duration-200",
                  useRag
                    ? "border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent))] font-medium shadow-sm hover:bg-[hsl(var(--accent-subtle)/0.8)]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Use Local Knowledge Base</span>
                {useRag && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse" />}
              </button>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {useRag ? "Semantic search active" : "Direct model query"}
              </span>
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                  autoResize
                  className="min-h-[44px] max-h-[200px] pr-2 py-3 text-sm resize-none"
                  disabled={isStreaming && !input}
                />
              </div>
              {isStreaming ? (
                <Button variant="outline" size="icon" onClick={handleStop} title="Stop generation">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || modelAvailable === false}
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-2 text-center">
              Responses generated locally by {modelName} · No data leaves this device
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (inline sliding panel) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--surface))] h-[calc(100vh-56px)] flex-shrink-0 min-w-[320px] max-w-[320px]"
          >
            {renderSidebarContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay (absolute drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-14 z-30 bg-black/40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed right-0 top-14 bottom-0 z-40 w-80 bg-[hsl(var(--surface))] border-l border-[hsl(var(--border))] md:hidden flex flex-col"
            >
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
