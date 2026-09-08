'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, Button } from '@/components/ui'
import { Trash2, AtSign, MoreVertical } from 'lucide-react'
import { Dropdown, DropdownItem } from '@/components/ui'

export function CommentThread({
  announcement,
  comments = [],
  onAddComment,
  onDeleteComment,
  onEditComment,
  currentUserId,
  workspaceMembers = [],
}) {
  const [commentText, setCommentText] = useState('')
  const [mentions, setMentions] = useState([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingText, setEditingText] = useState('')

  const handleCommentChange = (e) => {
    const text = e.target.value
    setCommentText(text)

    const atMatch = text.match(/@(\w*)$/)
    if (atMatch) {
      setMentionQuery(atMatch[1])
      setShowMentionSuggestions(true)
    } else {
      setShowMentionSuggestions(false)
      setMentionQuery('')
    }
  }

  const handleMentionSelect = (member) => {
    const text = commentText
    const atIndex = text.lastIndexOf('@')
    const beforeMention = text.substring(0, atIndex)
    const newText = beforeMention + `@${member.user.name} `
    setCommentText(newText)
    setShowMentionSuggestions(false)
    setMentions([...mentions, member.user.id])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    onAddComment?.({
      content: commentText,
      mentionIds: mentions,
      announcementId: announcement.id,
    })

    setCommentText('')
    setMentions([])
  }

  const filteredMembers = workspaceMembers.filter((m) =>
    m.user?.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const formatDate = (date) => {
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

  return (
    <div className="space-y-4">
      {/* Comments list */}
      <AnimatePresence>
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex gap-3"
          >
            <Avatar
              src={comment.author?.avatarUrl}
              name={comment.author?.name}
              size="sm"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">
                    {comment.author?.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                {comment.authorId === currentUserId && editingCommentId !== comment.id && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Dropdown trigger={<MoreVertical className="w-3 h-3" />} align="right">
                      <DropdownItem
                        onClick={() => {
                          setEditingCommentId(comment.id)
                          setEditingText(comment.content)
                        }}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => onDeleteComment?.(comment.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </div>
                )}
              </div>

              {editingCommentId === comment.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent resize-none text-sm"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        onEditComment?.(comment.id, editingText)
                        setEditingCommentId(null)
                        setEditingText('')
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingCommentId(null)
                        setEditingText('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-primary mt-1 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="border-t border-border pt-4 mt-4">
        <div className="flex gap-3">
          <Avatar size="sm" name="You" />
          <div className="flex-1 space-y-2">
            <div className="relative">
              <textarea
                value={commentText}
                onChange={handleCommentChange}
                placeholder="Add a comment... (type @ to mention)"
                className="w-full p-3 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
                rows="3"
              />

              {/* Mention suggestions */}
              <AnimatePresence>
                {showMentionSuggestions && mentionQuery !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10 min-w-max"
                  >
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleMentionSelect(member)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-2 transition-colors text-left"
                        >
                          <Avatar
                            src={member.user?.avatarUrl}
                            name={member.user?.name}
                            size="xs"
                          />
                          <span className="text-sm text-text-primary">
                            {member.user?.name}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-text-muted">
                        No members found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!commentText.trim()}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
