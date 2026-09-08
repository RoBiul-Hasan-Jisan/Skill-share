'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWorkspaceStore } from '@/store/workspaceStore'
import api from '@/lib/api'
import { Button, EmptyState, SkeletonCard, Avatar } from '@/components/ui'
import { Target, ListChecks, Megaphone, Flag, MessageSquare, Activity, ChevronDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
const entityIcons = {
  Goal: Target,
  ActionItem: ListChecks,
  Announcement: Megaphone,
  Milestone: Flag,
  Comment: MessageSquare,
}

const actionVerbs = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
  REORDER: 'reordered',
}

function formatRelativeTime(date) {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getTimePeriod(date) {
  const now = new Date()
  const logDate = new Date(date)
  const diff = now - logDate
  const days = Math.floor(diff / 86400000)

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'This Week'
  if (days < 30) return 'This Month'
  if (days < 365) return 'This Year'
  return 'Older'
}

function ActivityItem({ log, isLast, onViewDetails }) {
  const Icon = entityIcons[log.entityType] || Activity
  const verb = actionVerbs[log.action] || log.action.toLowerCase()
  const timeAgo = formatRelativeTime(log.createdAt)

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 relative cursor-pointer group"
      onClick={() => onViewDetails(log)}
    >
      {!isLast && (
        <div className="absolute left-[19px] top-10 w-px h-[calc(100%-8px)] bg-border" />
      )}

      <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0 z-10 group-hover:bg-accent group-hover:border-accent transition-colors">
        <Icon className="w-4 h-4 text-accent group-hover:text-white transition-colors" />
      </div>

      <div className="flex-1 bg-surface border border-border rounded-xl p-4 mb-3 group-hover:border-accent group-hover:bg-surface-2 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              src={log.actor?.avatarUrl}
              name={log.actor?.name}
              size="sm"
            />
            <span className="text-sm font-medium text-text-primary truncate">
              {log.actor?.name}
            </span>
            <span className="text-sm text-text-secondary truncate">
              {verb}
            </span>
            <span className="text-sm text-text-muted truncate">
              {log.entityType}
            </span>
          </div>
          <span className="text-xs text-text-muted flex-shrink-0 whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function ActivityPage() {
  const { id: workspaceId } = useParams()
  const { members } = useWorkspaceStore()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filterUser, setFilterUser] = useState('all')
  const [expandedUser, setExpandedUser] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)

  const userStats = logs.reduce((stats, log) => {
    const userId = log.actor?.id
    if (!userId) return stats
    if (!stats[userId]) {
      stats[userId] = { actor: log.actor, count: 0, logs: [] }
    }
    stats[userId].count += 1
    stats[userId].logs.push(log)
    return stats
  }, {})

  const filteredLogs = filterUser === 'all' ? logs : (userStats[filterUser]?.logs || [])

  useEffect(() => {
    if (!workspaceId) return
    fetchActivity()
  }, [workspaceId])

  const fetchActivity = async (cursor = null) => {
    try {
      if (!cursor) setLoading(true)
      const response = await api.get(
        `/workspaces/${workspaceId}/activity${cursor ? `?cursor=${cursor}` : ''}`
      )
      if (cursor) {
        setLogs([...logs, ...response.data.data])
      } else {
        setLogs(response.data.data)
      }
      setNextCursor(response.data.nextCursor)
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = async () => {
    if (nextCursor) {
      setLoadingMore(true)
      await fetchActivity(nextCursor)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
          Activity
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-2">
          Recent changes across your workspace
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Actions will appear here as your team makes changes"
        />
      ) : (
        <>
          {/* User Filter */}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setFilterUser('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterUser === 'all'
                  ? 'bg-accent text-white'
                  : 'bg-surface-2 text-text-primary hover:bg-surface'
              }`}
            >
              All Activities
            </button>
            {Object.entries(userStats).map(([userId, stat]) => (
              <motion.button
                key={userId}
                onClick={() => {
                  setFilterUser(filterUser === userId ? 'all' : userId)
                  setExpandedUser(expandedUser === userId ? null : userId)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filterUser === userId
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 text-text-primary hover:bg-surface'
                }`}
              >
                {stat.actor?.name}
                <span className="text-xs opacity-75">({stat.count})</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${expandedUser === userId ? 'rotate-180' : ''}`} />
              </motion.button>
            ))}
          </div>

          <div className="space-y-6">
            {Object.entries(
              filteredLogs.reduce((groups, log) => {
                const period = getTimePeriod(log.createdAt)
                if (!groups[period]) groups[period] = []
                groups[period].push(log)
                return groups
              }, {})
            )
              .sort(([periodA], [periodB]) => {
                const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'This Year', 'Older']
                return order.indexOf(periodA) - order.indexOf(periodB)
              })
              .map(([period, periodLogs]) => (
                <div key={period} className="space-y-2">
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider px-4">
                    {period}
                  </h3>
                  <div className="space-y-0">
                    {periodLogs.map((log, index) => (
                      <ActivityItem
                        key={log.id}
                        log={log}
                        isLast={index === periodLogs.length - 1}
                        onViewDetails={setSelectedLog}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {nextCursor && !loading && (
            <div className="flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="secondary"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}

          {/* Activity Detail Modal */}
          <AnimatePresence>
            {selectedLog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-surface border border-border rounded-2xl max-w-xl w-full"
                >
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                        {(() => {
                          const Icon = entityIcons[selectedLog.entityType] || Activity
                          return <Icon className="w-4 h-4 text-accent" />
                        })()}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-text-primary">
                          {actionVerbs[selectedLog.action] || selectedLog.action.toLowerCase()} {selectedLog.entityType}
                        </h2>
                        <p className="text-sm text-text-muted">
                          {new Date(selectedLog.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-text-muted" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Actor Info */}
                    <div>
                      <p className="text-sm font-medium text-text-muted mb-2">Made by</p>
                      <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
                        <Avatar
                          src={selectedLog.actor?.avatarUrl}
                          name={selectedLog.actor?.name}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{selectedLog.actor?.name}</p>
                          <p className="text-xs text-text-muted">{selectedLog.actor?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Change Details */}
                    <div>
                      <p className="text-sm font-medium text-text-muted mb-2">Details</p>
                      <div className="p-3 bg-surface-2 rounded-lg">
                        <p className="text-sm text-text-primary">
                          <strong>{selectedLog.entityType}:</strong> {selectedLog.entityName || 'N/A'}
                        </p>
                        <p className="text-sm text-text-secondary mt-2">
                          <strong>Action:</strong> {actionVerbs[selectedLog.action] || selectedLog.action.toLowerCase()}
                        </p>
                        {selectedLog.changes && (
                          <div className="mt-3 p-2 bg-surface rounded border border-border text-xs text-text-muted max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap break-words">
                              {JSON.stringify(selectedLog.changes, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div>
                      <p className="text-xs text-text-muted">
                        {formatRelativeTime(selectedLog.createdAt)} • {new Date(selectedLog.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
