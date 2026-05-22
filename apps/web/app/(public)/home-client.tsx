'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Lock,
  Wifi,
  Cpu,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SystemStatus {
  modelAvailable: boolean
  modelName: string
  activeUsers: number
  documentsCount: number
  deviceName: string
}

const appCards = [
  {
    href: '/chat',
    icon: MessageSquare,
    title: 'AI Chat',
    description: 'Ask questions, get answers. Powered by a local model — no data leaves this device.',
    accent: 'hsl(220 90% 56%)',
    badge: 'Local AI',
  },
  {
    href: '/knowledge',
    icon: BookOpen,
    title: 'Knowledge Base',
    description: 'Search and browse documents, manuals, and resources uploaded by your admin.',
    accent: 'hsl(145 65% 42%)',
    badge: 'Offline Ready',
  },
  {
    href: '/learn',
    icon: GraduationCap,
    title: 'Learn',
    description: 'Access offline learning modules and educational content via Kolibri.',
    accent: 'hsl(38 95% 48%)',
    badge: 'Kolibri',
  },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export function HomeClient() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/system/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 sm:py-16">
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        {/* Privacy indicator */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-1.5 text-xs text-[hsl(var(--muted-foreground))] mb-6">
          <Lock className="h-3 w-3 text-[hsl(var(--success))]" />
          <span>100% local · No cloud · No tracking</span>
          <Wifi className="h-3 w-3 text-[hsl(var(--accent))]" />
          <span>LAN only</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[hsl(var(--foreground))] mb-4">
          Welcome to{' '}
          <span className="gradient-text">ASKAI</span>
        </h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto text-balance">
          Your private AI and knowledge hub. Everything runs locally — AI chat,
          document search, and offline learning.
        </p>
      </motion.div>

      {/* System Status Bar */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-center gap-4 flex-wrap mb-10"
      >
        {loading ? (
          <>
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1 text-xs">
              {status?.modelAvailable ? (
                <CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" />
              ) : (
                <AlertCircle className="h-3 w-3 text-[hsl(var(--warning))]" />
              )}
              <Cpu className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
              <span className="text-[hsl(var(--foreground))]">
                {status?.modelName ?? 'No model'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1 text-xs">
              <Users className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
              <span className="text-[hsl(var(--foreground))]">
                {status?.activeUsers ?? 0} active
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1 text-xs">
              <BookOpen className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
              <span className="text-[hsl(var(--foreground))]">
                {status?.documentsCount ?? 0} documents
              </span>
            </div>
          </>
        )}
      </motion.div>

      {/* App Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
      >
        {appCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * (i + 1) }}
            >
              <Link href={card.href} className="block h-full">
                <div
                  className={cn(
                    'group relative h-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]',
                    'p-6 flex flex-col gap-4',
                    'transition-all duration-200',
                    'hover:border-[hsl(var(--border-strong))] hover:shadow-lg hover:-translate-y-0.5'
                  )}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.accent}18` }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: card.accent }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h2 className="font-semibold text-[hsl(var(--foreground))]">
                        {card.title}
                      </h2>
                      <Badge variant="muted" className="text-[10px]">
                        {card.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--accent))] transition-colors">
                    Open
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick action CTA */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <Button asChild size="lg">
          <Link href="/chat">
            <MessageSquare className="h-4 w-4" />
            Start a conversation
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/knowledge">
            <BookOpen className="h-4 w-4" />
            Browse knowledge
          </Link>
        </Button>
      </motion.div>

      {/* Device info footer */}
      <motion.p
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-12"
      >
        {status?.deviceName ?? 'ASKAI Hub'} · All data stays on this device
      </motion.p>
    </div>
  )
}
