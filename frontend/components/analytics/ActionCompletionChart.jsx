'use client'

import { Card } from '@/components/ui'
import { motion } from 'framer-motion'

export function ActionCompletionChart({ data = [] }) {
  const completed = data.filter((a) => a.status === 'DONE').length
  const total = data.length
  const percentage = total > 0 ? (completed / total) * 100 : 0

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card>
      <h3 className="font-semibold text-text-primary mb-6">Action Items Progress</h3>

      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg width="120" height="120" className="transform -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-surface-2"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#6366f1"
              strokeWidth="8"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">
                {Math.round(percentage)}%
              </p>
              <p className="text-xs text-text-muted">Complete</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-center">
        <p className="text-sm text-text-primary">
          <span className="font-semibold">{completed}</span> of{' '}
          <span className="font-semibold">{total}</span> completed
        </p>
        <p className="text-xs text-text-muted">
          {total - completed} {total - completed === 1 ? 'item' : 'items'} remaining
        </p>
      </div>
    </Card>
  )
}
