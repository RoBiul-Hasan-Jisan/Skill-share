'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { CommentThread } from '@/components/announcements/CommentThread'

export function EntityCommentThread({
  workspaceId,
  entityType,
  entityId,
  currentUserId,
  workspaceMembers,
}) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [workspaceId, entityId, entityType])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const entityPath = entityType === 'action' ? 'actions' : 'goals'
      const response = await api.get(
        `/workspaces/${workspaceId}/${entityPath}/${entityId}/comments`
      )
      setComments(response.data.data || [])
    } catch (error) {
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async ({ content, mentionIds }) => {
    try {
      const entityPath = entityType === 'action' ? 'actions' : 'goals'
      const response = await api.post(
        `/workspaces/${workspaceId}/${entityPath}/${entityId}/comments`,
        { content }
      )
      setComments([...comments, response.data.data])
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const entityPath = entityType === 'action' ? 'actions' : 'goals'
      await api.delete(
        `/workspaces/${workspaceId}/${entityPath}/${entityId}/comments/${commentId}`
      )
      setComments(comments.filter((c) => c.id !== commentId))
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-surface-2 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <CommentThread
      announcement={{ id: entityId }}
      comments={comments}
      onAddComment={handleAddComment}
      onDeleteComment={handleDeleteComment}
      currentUserId={currentUserId}
      workspaceMembers={workspaceMembers}
    />
  )
}
