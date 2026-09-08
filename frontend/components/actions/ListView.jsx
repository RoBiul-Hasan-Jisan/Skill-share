'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActionCard } from './ActionCard'
import { ChevronDown } from 'lucide-react'

const statuses = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
]

export function ListView({
  actions,
  onEdit,
  onDelete,
  onCommentClick,
  onProgressChange,
  selectedActions = [],
  onSelectAction,
  onSelectAll,
}) {
  const [expandedStatus, setExpandedStatus] = useState(null)

  const toggleStatus = (status) => {
    setExpandedStatus(expandedStatus === status ? null : status)
  }

  return (
    <div className="space-y-4">
      {statuses.map((status) => {
        const statusActions = actions.filter((a) => a.status === status.key)
        const isExpanded = expandedStatus === status.key

        return (
          <div key={status.key} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleStatus(status.key)}
              className="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                {onSelectAll && (
                  <input
                    type="checkbox"
                    checked={statusActions.length > 0 && statusActions.every(a => selectedActions.includes(a.id))}
                    onChange={() => {
                      statusActions.forEach(a => {
                        if (!selectedActions.includes(a.id)) {
                          onSelectAction(a.id)
                        }
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                )}
                <h3 className="font-semibold text-text-primary">
                  {status.label}
                </h3>
                <span className="text-xs text-text-muted bg-surface-2 px-2 py-1 rounded-full">
                  {statusActions.length}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border divide-y divide-border"
                >
                  {statusActions.length > 0 ? (
                    statusActions.map((action) => (
                      <div key={action.id} className="p-4 hover:bg-surface-2 transition-colors flex items-start gap-3">
                        {onSelectAction && (
                          <input
                            type="checkbox"
                            checked={selectedActions.includes(action.id)}
                            onChange={() => onSelectAction(action.id)}
                            className="w-4 h-4 rounded border-border cursor-pointer mt-1 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <ActionCard
                            action={action}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onCommentClick={onCommentClick}
                            onProgressChange={onProgressChange}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-text-muted text-sm">
                      No items
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
