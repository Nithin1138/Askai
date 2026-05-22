'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Server,
  AlertTriangle,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'

interface RequestLog {
  id: number
  path: string
  method: string
  statusCode: number
  durationMs: number | null
  ip: string | null
  userAgent: string | null
  createdAt: string
}

interface SystemEvent {
  id: number
  type: string
  payload: string | null
  severity: 'info' | 'warning' | 'error'
  createdAt: string
}

interface PaginationData {
  limit: number
  offset: number
  totalRequests: number
  totalEvents: number
}

export function LogsClient() {
  const [activeTab, setActiveTab] = useState<'requests' | 'system'>('requests')
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([])
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    limit: 50,
    offset: 0,
    totalRequests: 0,
    totalEvents: 0,
  })

  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all')
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null)

  const loadLogs = (offsetVal = pagination.offset) => {
    setLoading(true)
    fetch(`/api/admin/logs?limit=50&offset=${offsetVal}`)
      .then((r) => r.json())
      .then((data) => {
        setRequestLogs(data.requestLogs ?? [])
        setSystemEvents(data.systemEvents ?? [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
      })
      .catch((err) => console.error('Failed to load logs', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLogs(0)
  }, [])

  const handleRefresh = () => {
    loadLogs(pagination.offset)
  }

  const handleClearLogs = async () => {
    setClearing(true)
    try {
      const type = activeTab === 'requests' ? 'requests' : 'system'
      const res = await fetch(`/api/admin/logs?type=${type}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        if (activeTab === 'requests') {
          setRequestLogs([])
          setPagination((p) => ({ ...p, totalRequests: 0 }))
        } else {
          setSystemEvents([])
          setPagination((p) => ({ ...p, totalEvents: 0 }))
        }
        setConfirmClear(false)
      }
    } catch (err) {
      console.error('Failed to clear logs', err)
    } finally {
      setClearing(false)
    }
  }

  const handlePageChange = (direction: 'prev' | 'next') => {
    const step = 50
    let nextOffset = pagination.offset
    if (direction === 'next') {
      nextOffset += step
    } else {
      nextOffset = Math.max(0, nextOffset - step)
    }
    setPagination((p) => ({ ...p, offset: nextOffset }))
    loadLogs(nextOffset)
  }

  // Filter logs locally based on search query or severity selector
  const filteredRequests = useMemo(() => {
    return requestLogs.filter((log) => {
      const query = searchQuery.toLowerCase()
      return (
        log.path.toLowerCase().includes(query) ||
        log.method.toLowerCase().includes(query) ||
        log.statusCode.toString().includes(query) ||
        (log.ip && log.ip.includes(query))
      )
    })
  }, [requestLogs, searchQuery])

  const filteredEvents = useMemo(() => {
    return systemEvents.filter((ev) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        ev.type.toLowerCase().includes(query) ||
        (ev.payload && ev.payload.toLowerCase().includes(query))
      const matchesSeverity = severityFilter === 'all' || ev.severity === severityFilter
      return matchesSearch && matchesSeverity
    })
  }, [systemEvents, searchQuery, severityFilter])

  // Aggregate Stats
  const requestStats = useMemo(() => {
    if (requestLogs.length === 0) return { successRate: 100, avgDuration: 0 }
    const successCount = requestLogs.filter((r) => r.statusCode < 400).length
    const successRate = Math.round((successCount / requestLogs.length) * 100)
    const validDurations = requestLogs.filter((r) => r.durationMs !== null) as { durationMs: number }[]
    const avgDuration =
      validDurations.length > 0
        ? Math.round(validDurations.reduce((acc, curr) => acc + curr.durationMs, 0) / validDurations.length)
        : 0
    return { successRate, avgDuration }
  }, [requestLogs])

  const eventStats = useMemo(() => {
    const infoCount = systemEvents.filter((e) => e.severity === 'info').length
    const warningCount = systemEvents.filter((e) => e.severity === 'warning').length
    const errorCount = systemEvents.filter((e) => e.severity === 'error').length
    return { infoCount, warningCount, errorCount }
  }, [systemEvents])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <Terminal className="h-6 w-6 text-[hsl(var(--accent))]" />
            System Audit Logs
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Real-time API gateway access and diagnostic events audit log
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {confirmClear ? (
            <div className="flex items-center gap-1.5 bg-[hsl(var(--error-subtle))] p-1 rounded-lg border border-[hsl(var(--error)/0.2)]">
              <span className="text-[10px] font-semibold text-[hsl(var(--error))] px-1.5">Are you sure?</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-[hsl(var(--error))] text-white hover:bg-[hsl(var(--error))] border-0"
                onClick={handleClearLogs}
                disabled={clearing}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            (activeTab === 'requests' ? requestLogs.length > 0 : systemEvents.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                className="text-[hsl(var(--error))] hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error-subtle))]"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Clear Logs
              </Button>
            )
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[hsl(var(--border))]">
        <button
          onClick={() => {
            setActiveTab('requests')
            setSearchQuery('')
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all relative ${
            activeTab === 'requests'
              ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))] font-semibold'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <Activity className="h-4 w-4" />
          HTTP Request Logs
          {pagination.totalRequests > 0 && (
            <span className="ml-1.5 text-[10px] bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent-subtle-foreground))] px-1.5 py-0.5 rounded-full font-bold">
              {pagination.totalRequests}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('system')
            setSearchQuery('')
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all relative ${
            activeTab === 'system'
              ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))] font-semibold'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          <Server className="h-4 w-4" />
          System Events
          {pagination.totalEvents > 0 && (
            <span className="ml-1.5 text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-1.5 py-0.5 rounded-full font-bold">
              {pagination.totalEvents}
            </span>
          )}
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activeTab === 'requests' ? (
          <>
            <Card>
              <CardContent className="pt-4 pb-4">
                <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Total Checked</span>
                <p className="text-xl font-bold mt-1 text-[hsl(var(--foreground))]">{pagination.totalRequests}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Success Rate</span>
                <p className="text-xl font-bold mt-1 text-[hsl(var(--success))]">{requestStats.successRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Avg Latency</span>
                <p className="text-xl font-bold mt-1 text-[hsl(var(--accent))]">{requestStats.avgDuration} ms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Active Rate</span>
                <p className="text-xl font-bold mt-1 text-[hsl(var(--foreground))]">Fast</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-4 pb-4">
                <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Total System Events</span>
                <p className="text-xl font-bold mt-1 text-[hsl(var(--foreground))]">{pagination.totalEvents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Info Logs</span>
                <p className="text-xl font-bold mt-1 text-[hsl(var(--accent))]">{eventStats.infoCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Warnings</span>
                <p className="text-xl font-bold mt-1 text-[hsl(var(--warning))]">{eventStats.warningCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <span className="text-[10px] uppercase font-semibold text-[hsl(var(--muted-foreground))]">Errors</span>
                <p className="text-xl font-bold mt-1 text-[hsl(var(--error))]">{eventStats.errorCount}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder={
              activeTab === 'requests'
                ? 'Search requests by path, IP, status code...'
                : 'Search system events by type or keyword...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent))]"
          />
        </div>

        {activeTab === 'system' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">Severity:</span>
            <div className="flex rounded-lg border border-[hsl(var(--border))] p-0.5 bg-[hsl(var(--surface))]">
              {(['all', 'info', 'warning', 'error'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSeverityFilter(filter)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    severityFilter === filter
                      ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-semibold'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logs Table / List Container */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : activeTab === 'requests' ? (
            // Requests Log Table
            filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                <Activity className="h-8 w-8 mx-auto opacity-30 mb-3" />
                <p className="text-sm">No request logs match the criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3 font-semibold">Method</th>
                      <th className="px-4 py-3 font-semibold">Path</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                      <th className="px-4 py-3 font-semibold">Client IP</th>
                      <th className="px-4 py-3 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {filteredRequests.map((log) => {
                      const statusVariant =
                        log.statusCode < 300
                          ? 'success'
                          : log.statusCode < 400
                          ? 'warning'
                          : 'error'
                      const methodColor =
                        log.method === 'GET'
                          ? 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]'
                          : log.method === 'POST'
                          ? 'bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent-subtle-foreground))]'
                          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'

                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-[hsl(var(--surface-hover))] transition-colors"
                        >
                          <td className="px-4 py-3 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${methodColor}`}>
                              {log.method}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))] font-mono max-w-[240px] truncate" title={log.path}>
                            {log.path}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant} dot>
                              {log.statusCode}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] font-mono">
                            {log.durationMs ? `${log.durationMs}ms` : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[hsl(var(--muted-foreground))]">
                            {log.ip}
                          </td>
                          <td className="px-4 py-3 text-right text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                            {formatRelativeTime(log.createdAt)}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // System Events Log List
            filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                <Server className="h-8 w-8 mx-auto opacity-30 mb-3" />
                <p className="text-sm">No system diagnostic events match the criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-[hsl(var(--border))]">
                {filteredEvents.map((ev) => {
                  const severityVariant =
                    ev.severity === 'info'
                      ? 'default'
                      : ev.severity === 'warning'
                      ? 'warning'
                      : 'error'
                  const isExpanded = expandedEventId === ev.id

                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-[hsl(var(--surface-hover))] transition-colors cursor-pointer"
                      onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={severityVariant} dot>
                          {ev.severity.toUpperCase()}
                        </Badge>
                        <span className="font-mono font-semibold text-xs text-[hsl(var(--foreground))]">
                          {ev.type}
                        </span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-auto">
                          {formatRelativeTime(ev.createdAt)}
                        </span>
                        {ev.payload && (
                          <div className="text-[hsl(var(--muted-foreground))]">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        )}
                      </div>

                      {/* Expandable JSON details */}
                      <AnimatePresence>
                        {isExpanded && ev.payload && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 overflow-hidden"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking JSON contents
                          >
                            <pre className="p-3 rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))] overflow-x-auto text-[11px] font-mono text-[hsl(var(--foreground))] whitespace-pre-wrap max-h-60">
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(ev.payload), null, 2)
                                } catch {
                                  return ev.payload
                                }
                              })()}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Pagination Bar */}
      {!loading && (activeTab === 'requests' ? filteredRequests.length > 0 : filteredEvents.length > 0) && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {activeTab === 'requests' ? (
              <>
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + 50, pagination.totalRequests)} of{' '}
                {pagination.totalRequests} request logs
              </>
            ) : (
              <>
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + 50, pagination.totalEvents)} of{' '}
                {pagination.totalEvents} system events
              </>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('prev')}
              disabled={pagination.offset === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('next')}
              disabled={
                activeTab === 'requests'
                  ? pagination.offset + 50 >= pagination.totalRequests
                  : pagination.offset + 50 >= pagination.totalEvents
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
