'use client'

import { Card } from '@/components/ui'
import { motion } from 'framer-motion'

export function GoalStatusChart({ data = [] }) {
  const statuses = ['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']
  const colors = {
    ON_TRACK: '#22c55e',
    AT_RISK: '#eab308',
    BEHIND: '#ef4444',
    COMPLETED: '#6366f1',
  }

  const statusCounts = statuses.reduce((acc, status) => {
    acc[status] = data.filter((g) => g.status === status).length
    return acc
  }, {})

  const total = data.length
  const maxCount = Math.max(...Object.values(statusCounts), 1)

  return (
    <Card>
      <h3 className="font-semibold text-text-primary mb-4">Goal Status Distribution</h3>

      {total === 0 ? (
        <div className="text-center py-8 text-text-muted">
          No goals yet
        </div>
      ) : (
        <div className="space-y-4">
          {statuses.map((status) => {
            const count = statusCounts[status]
            const percentage = (count / total) * 100
            const barWidth = (count / maxCount) * 100

            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">
                    {status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-text-muted">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors[status] }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-border">
        {statuses.map((status) => (
          <div key={status} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors[status] }}
            />
            <span className="text-text-muted">{status.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
