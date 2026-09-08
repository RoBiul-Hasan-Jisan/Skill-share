'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DOMPurify from 'isomorphic-dompurify'
import { Card, Avatar, Badge } from '@/components/ui'
import { MoreVertical, Trash2, Pin, MessageCircle, SmilePlus } from 'lucide-react'
import { Dropdown, DropdownItem } from '@/components/ui'

const reactionEmojis = ['👍', '❤️', '😂', '🎉', '🔥', '😍', '🤔', '👏']

export function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onCommentClick,
  currentUserId,
  isPinned = false,
}) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const userReactions = announcement.reactions?.filter((r) => r.userId === currentUserId) || []
  const reactionGroups = announcement.reactions?.reduce((acc, r) => {
    const key = r.emoji
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {}) || {}

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card hover className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar
              src={announcement.author?.avatarUrl}
              name={announcement.author?.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-primary truncate">
                  {announcement.author?.name}
                </h3>
                {announcement.isPinned && (
                  <Badge variant="default" size="sm">
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-muted">{formatDate(announcement.createdAt)}</p>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              trigger={<MoreVertical className="w-4 h-4" />}
              align="right"
            >
              {announcement.authorId === currentUserId && (
                <>
                  <DropdownItem onClick={() => onEdit?.(announcement)}>
                    Edit
                  </DropdownItem>
                  <DropdownItem onClick={() => onDelete?.(announcement.id)} className="text-red-600">
                    <Trash2 className="w-3 h-3 inline mr-2" />
                    Delete
                  </DropdownItem>
                </>
              )}
              <DropdownItem onClick={() => onPin?.(announcement.id)}>
                <Pin className="w-3 h-3 inline mr-2" />
                {announcement.isPinned ? 'Unpin' : 'Pin'}
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div
            className="text-text-primary prose-a:text-accent"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(announcement.content) }}
          />
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(reactionGroups).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(announcement.id, emoji)}
                className={`px-2 py-1 rounded-full text-sm transition-colors ${
                  userReactions.some((r) => r.emoji === emoji)
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 hover:bg-surface'
                }`}
              >
                {emoji} {reactions.length}
              </button>
            ))}
          </div>
        )}

        {/* Footer with actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <div className="relative">
            <button
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <SmilePlus className="w-4 h-4" />
              React
            </button>
            <AnimatePresence>
              {showReactionPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                  className="absolute bottom-full left-0 mb-2 bg-surface border border-border rounded-lg shadow-lg p-2 flex gap-1 z-10"
                >
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact?.(announcement.id, emoji)
                        setShowReactionPicker(false)
                      }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => onCommentClick?.(announcement)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {announcement._count?.comments || 0} Comments
          </button>
        </div>
      </Card>
    </motion.div>
  )
}
