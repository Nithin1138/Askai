'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, RefreshCw, Monitor, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'

interface Session {
  id: string
  ip: string
  userAgent: string | null
  lastSeen: string
  createdAt: string
}

export function SessionsClient() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/sessions')
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Devices currently using ASKAI on this network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={sessions.length > 0 ? 'success' : 'muted'} dot>
            {sessions.length} active
          </Badge>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Connected Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10">
              <Monitor className="h-8 w-8 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No active sessions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] px-4 py-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-mono text-[hsl(var(--foreground))]">{session.ip}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                      {session.userAgent ?? 'Unknown device'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" dot className="mb-1">Active</Badge>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {formatRelativeTime(session.lastSeen)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
