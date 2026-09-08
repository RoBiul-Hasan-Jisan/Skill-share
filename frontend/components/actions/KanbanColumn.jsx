'use client'

import { motion } from 'framer-motion'
import { ActionCard } from './ActionCard'

export function KanbanColumn({
  status,
  label,
  actions,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isOver = false,
  onCommentClick,
  onProgressChange,
}) {
  return (
    <div
      className={`bg-surface rounded-lg flex flex-col min-h-96 transition-colors ${
        isOver ? 'bg-surface-2' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver?.(status)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop?.(status)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          onDragOver?.(null)
        }
      }}
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-text-primary">
          {label}
        </h3>
        <p className="text-xs text-text-muted">
          {actions.length} {actions.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {actions.length > 0 ? (
          <motion.div
            layout
            className="space-y-3"
          >
            {actions.map((action) => (
              <div
                key={action.id}
                draggable
                onDragStart={(e) => onDragStart?.(action, status)}
                className="cursor-move"
              >
                <ActionCard
                  action={action}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCommentClick={onCommentClick}
                  onProgressChange={onProgressChange}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-40 text-text-muted text-sm">
            No items
          </div>
        )}
      </div>
    </div>
  )
}
