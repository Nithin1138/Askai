'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Video,
  Globe,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KolibriStatus {
  available: boolean
  url: string
  version?: string
}

const LEARNING_PACKS = [
  {
    icon: BookOpen,
    title: 'Foundation Literacy',
    description: 'Reading, writing, and basic numeracy for all levels',
    status: 'via-kolibri' as const,
    color: 'hsl(220 90% 56%)',
  },
  {
    icon: Video,
    title: 'STEM Education',
    description: 'Science, mathematics, engineering fundamentals',
    status: 'via-kolibri' as const,
    color: 'hsl(145 65% 42%)',
  },
  {
    icon: Globe,
    title: 'Life Skills',
    description: 'Health, communication, and vocational skills',
    status: 'coming-soon' as const,
    color: 'hsl(38 95% 48%)',
  },
]

export function LearnClient() {
  const [kolibri, setKolibri] = useState<KolibriStatus | null>(null)
  const [checking, setChecking] = useState(true)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      setChecking(false)
      setKolibri((prev) => prev || { available: false, url: 'http://localhost:8080' })
    }, 2500)

    fetch('/api/system/kolibri', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setKolibri(data)
        setChecking(false)
      })
      .catch(() => {
        setKolibri((prev) => prev || { available: false, url: 'http://localhost:8080' })
        setChecking(false)
      })
      .finally(() => {
        clearTimeout(timeoutId)
      })

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-[hsl(38_95%_48%/0.12)] flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-[hsl(38_95%_48%)]" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Learn</h1>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Offline educational content powered by Kolibri
        </p>
      </motion.div>

      {/* Kolibri launcher card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div
          className={cn(
            'rounded-2xl border p-6',
            kolibri?.available
              ? 'border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success-subtle))]'
              : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
          )}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white dark:bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center shadow-sm">
                <GraduationCap className="h-6 w-6 text-[hsl(38_95%_48%)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[hsl(var(--foreground))]">Kolibri</h2>
                  {checking ? (
                    <Badge variant="muted">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking…
                    </Badge>
                  ) : kolibri?.available ? (
                    <Badge variant="success" dot>Live</Badge>
                  ) : (
                    <Badge variant="warning">Not running</Badge>
                  )}
                  {kolibri?.version && (
                    <Badge variant="muted" className="text-[10px]">v{kolibri.version}</Badge>
                  )}
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>
                    {kolibri?.available
                      ? `Running at ${kolibri.url} — click to open`
                      : 'Start Kolibri to access offline learning content'}
                  </span>
                  {!checking && (
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="text-xs text-[hsl(var(--accent))] hover:underline font-medium focus:outline-none"
                    >
                      {showInstructions ? '(Hide setup guide)' : '(Show setup guide)'}
                    </button>
                  )}
                </p>
              </div>
            </div>
            {kolibri?.available ? (
              <Button asChild>
                <a href={kolibri.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open Kolibri
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <AlertCircle className="h-4 w-4" />
                Not available
              </Button>
            )}
          </div>

          {(showInstructions || (!kolibri?.available && !checking)) && (
            <div className="mt-4 p-4 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs font-medium text-[hsl(var(--foreground))] mb-2 flex items-center justify-between">
                <span>How to install & start Kolibri:</span>
                {kolibri?.available && (
                  <span className="text-[10px] font-normal text-[hsl(var(--success))] bg-[hsl(var(--success-subtle))] px-1.5 py-0.5 rounded border border-[hsl(var(--success)/0.2)]">
                    Already running
                  </span>
                )}
              </p>
              <div className="space-y-2">
                <div className="relative group">
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">1. Install using pip:</div>
                  <code className="block text-xs font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface))] rounded px-2 py-1.5 border border-[hsl(var(--border))]">
                    pip install kolibri
                  </code>
                </div>
                <div className="relative group">
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] mb-0.5">2. Start the server:</div>
                  <code className="block text-xs font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface))] rounded px-2 py-1.5 border border-[hsl(var(--border))]">
                    kolibri start
                  </code>
                </div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-2">
                  Once started, configure the URL in Admin → Settings → Kolibri (defaults to http://localhost:8080)
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Learning packs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">
          Learning Content Areas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LEARNING_PACKS.map((pack, i) => {
            const Icon = pack.icon
            return (
              <motion.div
                key={pack.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
              >
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${pack.color}18` }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: pack.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {pack.title}
                      </h4>
                      {pack.status === 'coming-soon' && (
                        <Badge variant="muted" className="text-[10px]">Soon</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {pack.description}
                    </p>
                  </div>
                  {pack.status === 'via-kolibri' && kolibri?.available && (
                    <a
                      href={kolibri.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[hsl(var(--accent))] flex items-center gap-1 hover:underline"
                    >
                      Open in Kolibri <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
