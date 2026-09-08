'use client'

import { useState, useEffect } from 'react'
import { Modal, Button } from '@/components/ui'
import { Bold, Italic, List } from 'lucide-react'

export function AnnouncementModal({
  isOpen,
  onClose,
  onSubmit,
  announcement = null,
}) {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || '')
      setContent(announcement.content || '')
    } else {
      setTitle('')
      setContent('')
    }
  }, [announcement, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      title,
      content: content || '',
    })
  }

  const insertMarkdown = (before, after = '') => {
    const textarea = document.getElementById('announcement-content')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end)

    setContent(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={announcement ? 'Edit Announcement' : 'Create Announcement'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title input */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-2">
            Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a title..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Content editor */}
        <div>
          <label className="text-sm font-medium text-text-primary block mb-2">
            Announcement
          </label>

          {/* Toolbar */}
          <div className="flex gap-1 mb-2 p-2 bg-surface rounded-t-lg border border-b-0 border-border">
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              className="p-2 hover:bg-surface-2 rounded transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('_', '_')}
              className="p-2 hover:bg-surface-2 rounded transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('- ', '')}
              className="p-2 hover:bg-surface-2 rounded transition-colors"
              title="Bullet list"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Content textarea */}
          <textarea
            id="announcement-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your announcement... (Supports **bold**, _italic_, and - bullet points)"
            className="w-full px-3 py-2 rounded-b-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            rows="8"
            required
          />
        </div>

        {/* Preview */}
        {content && (
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Preview</p>
            <div className="p-3 bg-surface rounded-lg border border-border text-text-primary text-sm max-h-32 overflow-y-auto">
              {content.split('\n').map((line, i) => (
                <div key={i} className="mb-1">
                  {line.replace(/\*\*(.*?)\*\*/g, '').replace(/_(.*?)_/g, '')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="submit" variant="primary" className="flex-1">
            {announcement ? 'Update' : 'Post'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
