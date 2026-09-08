'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Download, Loader2, Shield, User } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

function formatAction(action, entityType) {
  const entity = (entityType || '').replace(/([a-z])([A-Z])/g, '$1 $2')
  return `${entity}.${action}`
}

export default function AuditPage() {
  const { id: workspaceId } = useParams()
  const { user } = useAuthStore()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [userRole, setUserRole] = useState(null)
  const canViewAll = userRole && ['ADMIN', 'MODERATOR', 'PROJECT_MANAGER'].includes(userRole)

  useEffect(() => {
    if (!workspaceId) return
    setLoading(true)
    api.get(`/workspaces/${workspaceId}/audit`)
      .then((res) => {
        setLogs(res.data.data || [])
        setUserRole(res.data.role)
      })
      .catch((err) => console.error('Failed to fetch audit logs:', err))
      .finally(() => setLoading(false))
  }, [workspaceId])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const actorName = log.actor?.name || log.actorId || ''
      const actionLabel = `${log.action} ${log.entityType || ''}`
      const actorMatch = !actor || actorName.toLowerCase().includes(actor.toLowerCase())
      const actionMatch = !action || actionLabel.toLowerCase().includes(action.toLowerCase())
      const fromMatch = !fromDate || new Date(log.createdAt) >= new Date(fromDate)
      const toMatch = !toDate || new Date(log.createdAt) <= new Date(toDate + 'T23:59:59')
      return actorMatch && actionMatch && fromMatch && toMatch
    })
  }, [logs, actor, action, fromDate, toDate])

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Description']
    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.actor?.name || log.actorId,
      formatAction(log.action, log.entityType),
      `${log.entityType} · ${log.entityId}`,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-xl font-semibold tracking-tight text-text-primary mb-2">Audit</h1>
        <p className="text-text-secondary">
          Immutable timeline of workspace activity — filterable by actor, action, and date.
        </p>
      </motion.div>

      {/* Action Bar */}
      <motion.div
        className="flex items-center justify-between gap-4 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-muted font-medium">
            {filteredLogs.length} ENTRIES
          </div>
          <Badge variant="default" size="sm" className="flex items-center gap-1">
            {canViewAll ? (
              <><Shield className="w-3 h-3" /> All workspace logs</>
            ) : (
              <><User className="w-3 h-3" /> Your logs</>
            )}
          </Badge>
        </div>
        <Button
          onClick={downloadCSV}
          variant="primary"
          size="md"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          DOWNLOAD CSV
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="bg-surface border border-border rounded-xl p-6 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          § FILTERS · 01
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${canViewAll ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {canViewAll && (
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                Actor
              </label>
              <input
                type="text"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                placeholder="Name or email..."
                className="w-full px-3 py-2 border-b border-border bg-transparent text-text-primary placeholder-text-muted outline-none transition-colors hover:border-text-secondary focus:border-accent"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
              Action
            </label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. goal.create"
              className="w-full px-3 py-2 border-b border-border bg-transparent text-text-primary placeholder-text-muted outline-none transition-colors hover:border-text-secondary focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border-b border-border bg-transparent text-text-primary outline-none transition-colors hover:border-text-secondary focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border-b border-border bg-transparent text-text-primary outline-none transition-colors hover:border-text-secondary focus:border-accent"
            />
          </div>
        </div>
      </motion.div>

      {/* Entries */}
      <motion.div
        className="bg-surface border border-border rounded-xl p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">
          § ENTRIES · {filteredLogs.length.toString().padStart(2, '0')}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">No audit entries match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="border-b border-border pb-4 last:border-b-0"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-2">
                  <div>
                    <p className="text-xs text-text-muted uppercase">Timestamp</p>
                    <p className="text-sm font-medium text-text-primary">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase">Actor</p>
                    <p className="text-sm font-medium text-text-primary">
                      {log.actor?.name || log.actorId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase">Action</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatAction(log.action, log.entityType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase">Description</p>
                    <p className="text-sm font-medium text-text-primary">
                      {log.entityType} · {log.entityId}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        className="text-xs text-text-muted text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        END OF RECORD · PAGE 01 OF 01
      </motion.div>
    </motion.div>
  )
}
