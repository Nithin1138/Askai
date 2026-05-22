'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu,
  FileText,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Database,
  Wifi,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, formatBytes } from '@/lib/utils'

interface DashboardStats {
  modelAvailable: boolean
  modelName: string
  modelsInstalled: number
  activeUsers: number
  documentsCount: number
  deviceName: string
  hostname: string
  uptime: number
  recentSessions: number
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  accent,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  subtitle?: string
  accent?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                {title}
              </p>
              <p className="text-2xl font-bold mt-1 text-[hsl(var(--foreground))]">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{subtitle}</p>
              )}
            </div>
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: accent ? `${accent}18` : 'hsl(var(--muted))' }}
            >
              <Icon
                className="h-5 w-5"
                style={{ color: accent ?? 'hsl(var(--muted-foreground))' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () =>
      fetch('/api/system/status')
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {})
        .finally(() => setLoading(false))

    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          System overview and health status
        </p>
      </div>

      {/* Model status banner */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${
            stats?.modelAvailable
              ? 'border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success-subtle))]'
              : 'border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning-subtle))]'
          }`}
        >
          {stats?.modelAvailable ? (
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))]" />
          )}
          <div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              {stats?.modelAvailable
                ? `AI model ready: ${stats.modelName}`
                : 'AI model unavailable — Ollama may not be running'}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {stats?.modelAvailable
                ? `${stats.modelsInstalled} model(s) installed`
                : 'Run: ollama serve — then refresh'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {stats?.modelAvailable && (
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            )}
            <Badge
              variant={stats?.modelAvailable ? 'success' : 'warning'}
            >
              {stats?.modelAvailable ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Active Users"
            value={stats?.activeUsers ?? 0}
            icon={Users}
            subtitle="Last 5 minutes"
            accent="hsl(220 90% 56%)"
          />
          <StatCard
            title="Documents"
            value={stats?.documentsCount ?? 0}
            icon={FileText}
            subtitle="Ready for search"
            accent="hsl(145 65% 42%)"
          />
          <StatCard
            title="Models"
            value={stats?.modelsInstalled ?? 0}
            icon={Cpu}
            subtitle="Installed locally"
            accent="hsl(38 95% 48%)"
          />
          <StatCard
            title="Uptime"
            value={formatUptime(stats?.uptime ?? 0)}
            icon={Clock}
            subtitle={stats?.hostname}
            accent="hsl(280 70% 60%)"
          />
        </div>
      )}

      {/* System info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </>
            ) : (
              <>
                <InfoRow label="Device Name" value={stats?.deviceName ?? '—'} />
                <InfoRow label="Hostname" value={stats?.hostname ?? '—'} />
                <InfoRow label="Active Model" value={stats?.modelName ?? '—'} />
                <InfoRow
                  label="Status"
                  value={
                    <Badge variant={stats?.modelAvailable ? 'success' : 'warning'} dot>
                      {stats?.modelAvailable ? 'Operational' : 'Degraded'}
                    </Badge>
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wifi className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction href="/admin/documents" label="Manage Documents" />
            <QuickAction href="/admin/models" label="View Models" />
            <QuickAction href="/admin/sessions" label="Active Sessions" />
            <QuickAction href="/admin/logs" label="Request Logs" />
            <QuickAction href="/admin/settings" label="Settings" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[hsl(var(--border))] last:border-0">
      <span className="text-xs text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="text-xs font-medium text-[hsl(var(--foreground))]">{value}</span>
    </div>
  )
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--foreground))] transition-colors group"
    >
      {label}
      <span className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--accent))] transition-colors">→</span>
    </a>
  )
}
