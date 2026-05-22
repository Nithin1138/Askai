'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  BookOpen,
  FileText,
  File,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBytes, formatRelativeTime } from '@/lib/utils'

interface Document {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  status: string
  collectionId: string | null
  createdAt: string
}

export function KnowledgeClient() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetch('/api/knowledge/documents')
      .then((r) => r.json())
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredDocs = documents.filter((d) =>
    d.originalName.toLowerCase().includes(search.toLowerCase())
  )

  const readyDocs = filteredDocs.filter((d) => d.status === 'ready')

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-[hsl(145_65%_42%/0.12)] flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-[hsl(145_65%_42%)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Knowledge Base</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {documents.filter((d) => d.status === 'ready').length} documents available
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            id="knowledge-search"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 text-sm"
          />
          {searching && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[hsl(var(--muted-foreground))]" />
          )}
        </div>
      </motion.div>

      {/* Documents */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : readyDocs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
            <BookOpen className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {search ? 'No matching documents' : 'No documents available'}
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
            {search
              ? 'Try searching with different keywords'
              : 'Ask your administrator to upload documents to the knowledge base'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {readyDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  onClick={() => window.open(`/api/knowledge/documents/${doc.id}`, '_blank')}
                  className="flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4 hover:border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--surface-hover))] transition-all group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-2">
                      <span>{formatBytes(doc.sizeBytes)}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(doc.createdAt)}</span>
                    </p>
                  </div>
                  <Badge variant="success" dot className="flex-shrink-0">
                    Ready
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--accent))] transition-colors opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
