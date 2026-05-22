'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBytes } from '@/lib/utils'

interface Model {
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

const SUGGESTED_MODELS = [
  { name: 'gemma3:1b', desc: 'Fast, 1B params — great for low-resource devices' },
  { name: 'phi3:mini', desc: 'Microsoft Phi-3, 3.8B — strong reasoning' },
  { name: 'qwen2.5:3b', desc: 'Qwen 2.5, multilingual support' },
  { name: 'nomic-embed-text', desc: 'Text embeddings for RAG search' },
]

export function ModelsClient() {
  const [models, setModels] = useState<Model[]>([])
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [pullName, setPullName] = useState('')
  const [pulling, setPulling] = useState(false)
  const [pullMsg, setPullMsg] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/models')
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models ?? [])
        setAvailable(data.available)
      })
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handlePull = async (name: string) => {
    setPulling(true)
    setPullMsg(null)
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      setPullMsg(data.message ?? 'Pull initiated — check Ollama terminal for progress')
      setTimeout(() => { load(); setPullMsg(null) }, 3000)
    } catch {
      setPullMsg('Failed to pull model')
    } finally {
      setPulling(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Models</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage locally installed Ollama models
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Ollama status */}
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${
          available
            ? 'border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success-subtle))]'
            : 'border-[hsl(var(--error)/0.3)] bg-[hsl(var(--error-subtle))]'
        }`}
      >
        {available ? (
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
        ) : (
          <AlertCircle className="h-4 w-4 text-[hsl(var(--error))]" />
        )}
        <span className="text-sm font-medium">
          {available ? 'Ollama is running' : 'Ollama is not running — start with: ollama serve'}
        </span>
        <Badge variant={available ? 'success' : 'error'} className="ml-auto">
          {available ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* Installed models */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Installed Models ({models.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
              No models installed. Pull one below.
            </div>
          ) : (
            <div className="space-y-2">
              {models.map((model, i) => (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{model.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {formatBytes(model.size)}
                      {model.details?.parameterSize && ` · ${model.details.parameterSize}`}
                      {model.details?.quantizationLevel && ` · ${model.details.quantizationLevel}`}
                    </p>
                  </div>
                  <Badge variant="success" dot>Ready</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pull model */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Pull a Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. phi3:mini or nomic-embed-text"
              value={pullName}
              onChange={(e) => setPullName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePull(pullName)}
            />
            <Button
              onClick={() => handlePull(pullName)}
              disabled={pulling || !pullName.trim()}
              loading={pulling}
            >
              Pull
            </Button>
          </div>
          {pullMsg && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{pullMsg}</p>
          )}
          <div className="mt-4">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">
              Suggested models:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_MODELS.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setPullName(m.name)}
                  className="text-left rounded-lg border border-[hsl(var(--border))] px-3 py-2 hover:border-[hsl(var(--accent)/0.5)] hover:bg-[hsl(var(--surface-hover))] transition-colors"
                >
                  <p className="text-xs font-mono font-medium text-[hsl(var(--foreground))]">{m.name}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
