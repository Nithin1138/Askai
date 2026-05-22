'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  File,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBytes, formatRelativeTime } from '@/lib/utils'

interface Document {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  status: 'pending' | 'processing' | 'ready' | 'error'
  collectionId: string | null
  createdAt: string
  errorMessage: string | null
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', variant: 'muted' as const, icon: Clock },
  processing: { label: 'Processing', variant: 'warning' as const, icon: RefreshCw },
  ready: { label: 'Ready', variant: 'success' as const, icon: CheckCircle2 },
  error: { label: 'Error', variant: 'error' as const, icon: AlertCircle },
}

export function DocumentsClient() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/documents')
      .then((r) => r.json())
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (!fileArray.length) return

    setUploading(true)
    for (const file of fileArray) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('collectionId', 'general')

      try {
        const res = await fetch('/api/admin/documents', { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json()
          alert(err.error ?? 'Upload failed')
        }
      } catch {
        alert('Upload failed')
      }
    }
    setUploading(false)
    load()
  }, [load])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleUpload(e.dataTransfer.files)
    },
    [handleUpload]
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' })
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert('Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = documents.filter((d) =>
    d.originalName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Upload and manage documents for the knowledge base
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-8 mb-6 text-center ${
          dragOver
            ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent-subtle))]'
            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border-strong))]'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".pdf,.txt,.md,.markdown"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
        <Upload className={`h-8 w-8 mx-auto mb-3 ${dragOver ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--muted-foreground))]'}`} />
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
          {uploading ? 'Uploading…' : 'Drop files here or click to upload'}
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
          Supports PDF, TXT, Markdown — max 50MB per file
        </p>
        {uploading && (
          <div className="mt-3 h-1 w-32 mx-auto bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <div className="h-full bg-[hsl(var(--accent))] animate-pulse rounded-full" />
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
        <Input
          placeholder="Search documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Documents list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Documents ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <File className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                {search ? 'No matching documents' : 'No documents uploaded yet'}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {search ? 'Try a different search term' : 'Upload a PDF, TXT, or Markdown file above'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((doc, i) => {
                  const statusConfig = STATUS_CONFIG[doc.status]
                  const StatusIcon = statusConfig.icon
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--surface-hover))] transition-colors"
                    >
                      <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                          {doc.originalName}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatBytes(doc.sizeBytes)} · {formatRelativeTime(doc.createdAt)}
                        </p>
                      </div>
                      <Badge variant={statusConfig.variant}>
                        <StatusIcon
                          className={`h-3 w-3 ${doc.status === 'processing' ? 'animate-spin' : ''}`}
                        />
                        {statusConfig.label}
                      </Badge>
                      {doc.status === 'ready' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => window.open(`/api/knowledge/documents/${doc.id}`, '_blank')}
                          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent))]"
                          title="View Document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(doc.id)}
                        loading={deletingId === doc.id}
                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--error))]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
