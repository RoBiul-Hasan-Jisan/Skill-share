'use client'

import { useState } from 'react'
import { KanbanColumn } from './KanbanColumn'

const statuses = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
]

export function KanbanBoard({
  actions,
  onEdit,
  onDelete,
  onReorder,
  onCommentClick,
  onProgressChange,
}) {
  const [draggedItem, setDraggedItem] = useState(null)
  const [overColumn, setOverColumn] = useState(null)

  const handleDragStart = (action, fromStatus) => {
    setDraggedItem({ action, fromStatus })
  }

  const handleDragOver = (toStatus) => {
    setOverColumn(toStatus)
  }

  const handleDrop = (toStatus) => {
    if (!draggedItem || draggedItem.fromStatus === toStatus) {
      setDraggedItem(null)
      setOverColumn(null)
      return
    }

    onReorder?.(draggedItem.action.id, draggedItem.fromStatus, toStatus)
    setDraggedItem(null)
    setOverColumn(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
      {statuses.map((status) => (
        <KanbanColumn
          key={status.key}
          status={status.key}
          label={status.label}
          actions={actions.filter((a) => a.status === status.key)}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isOver={overColumn === status.key}
          onCommentClick={onCommentClick}
          onProgressChange={onProgressChange}
        />
      ))}
    </div>
  )
}
