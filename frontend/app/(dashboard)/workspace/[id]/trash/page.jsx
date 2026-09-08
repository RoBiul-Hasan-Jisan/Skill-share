'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Button, EmptyState, Badge, Avatar } from '@/components/ui'
import { Trash2, RotateCcw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

function formatDeletedDate(deletedAt) {
  const now = new Date()
  const deleted = new Date(deletedAt)
  const daysAgo = Math.floor((now - deleted) / (1000 * 60 * 60 * 24))

  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7) return `${daysAgo} days ago`
  return 'More than 7 days ago'
}

function TrashItem({ item, type, workspaceId, onRestore, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between p-4 bg-surface-2 rounded-lg border border-border hover:border-accent/50 transition-colors"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Avatar
          src={item.owner?.avatarUrl || item.author?.avatarUrl || item.assignee?.avatarUrl}
          name={item.owner?.name || item.author?.name || item.assignee?.name || 'Unknown'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary truncate">{item.title || item.content?.substring(0, 50)}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" size="sm">{type}</Badge>
            <span className="text-xs text-text-muted">{formatDeletedDate(item.deletedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        {!confirming ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRestore(item.id, type)}
              className="gap-2 text-xs sm:text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">Restore</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(true)}
              className="text-red-400 hover:bg-red-500/10 p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs sm:text-sm text-text-primary">Delete forever?</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirming(false)}
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id, type)}
              className="text-red-400 hover:bg-red-500/10"
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default function TrashPage() {
  const { id: workspaceId } = useParams()
  const [trash, setTrash] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    fetchTrash()
  }, [workspaceId])

  const fetchTrash = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/trash`)
      setTrash(response.data.data)
    } catch (error) {
      console.error('Failed to fetch trash:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (itemId, type) => {
    try {
      const endpoint = type === 'Goal' ? 'goals' : type === 'Action' ? 'actions' : 'announcements'
      await api.patch(`/workspaces/${workspaceId}/${endpoint}/${itemId}/restore`)

      // Update local state
      setTrash(prev => ({
        ...prev,
        [type === 'Goal' ? 'goals' : type === 'Action' ? 'actions' : 'announcements']:
          prev[type === 'Goal' ? 'goals' : type === 'Action' ? 'actions' : 'announcements'].filter(
            item => item.id !== itemId
          )
      }))

      toast.success(`${type} restored successfully`)
    } catch (error) {
      toast.error(`Failed to restore ${type.toLowerCase()}`)
    }
  }

  const handleDelete = async (itemId, type) => {
    try {
      const endpoint = type === 'Goal' ? 'goals' : type === 'Action' ? 'actions' : 'announcements'
      await api.delete(`/workspaces/${workspaceId}/trash/${endpoint}/${itemId}`)

      // Update local state
      setTrash(prev => ({
        ...prev,
        [type === 'Goal' ? 'goals' : type === 'Action' ? 'actions' : 'announcements']:
          prev[type === 'Goal' ? 'goals' : type === 'Action' ? 'actions' : 'announcements'].filter(
            item => item.id !== itemId
          )
      }))

      toast.success(`${type} permanently deleted`)
    } catch (error) {
      toast.error(`Failed to delete ${type.toLowerCase()}`)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Loading trash...</div>
  }

  const hasItems = trash && (trash.goals?.length > 0 || trash.actions?.length > 0 || trash.announcements?.length > 0)

  if (!hasItems) {
    return (
      <EmptyState
        icon={Trash2}
        title="Trash is empty"
        description="Deleted items will appear here for 7 days before permanent deletion"
      />
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
          Deleted
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-2">Items are permanently deleted after 7 days</p>
      </div>

      {/* Goals */}
      {trash.goals && trash.goals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Badge variant="secondary">Goals</Badge>
            ({trash.goals.length})
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {trash.goals.map(goal => (
                <TrashItem
                  key={goal.id}
                  item={goal}
                  type="Goal"
                  workspaceId={workspaceId}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Actions */}
      {trash.actions && trash.actions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Badge variant="secondary">Actions</Badge>
            ({trash.actions.length})
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {trash.actions.map(action => (
                <TrashItem
                  key={action.id}
                  item={action}
                  type="Action"
                  workspaceId={workspaceId}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Announcements */}
      {trash.announcements && trash.announcements.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Badge variant="secondary">Announcements</Badge>
            ({trash.announcements.length})
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {trash.announcements.map(announcement => (
                <TrashItem
                  key={announcement.id}
                  item={announcement}
                  type="Announcement"
                  workspaceId={workspaceId}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
