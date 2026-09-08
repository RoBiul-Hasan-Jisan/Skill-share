'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { Avatar, Button } from '@/components/ui'

const notificationIcons = {
  goal: '🎯',
  action: '✓',
  announcement: '📢',
  mention: '@',
  comment: '💬',
}

export function NotificationBell({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const formatTime = (date) => {
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-surface rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-text-primary" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-96 bg-surface border border-border rounded-lg shadow-lg z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAllRead?.()}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              <AnimatePresence>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`p-3 hover:bg-surface-2 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-accent/5' : ''
                      }`}
                      onClick={() => onMarkRead?.(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className="text-lg flex-shrink-0">
                          {notificationIcons[notif.type] || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">
                            {notif.title}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {formatTime(notif.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDismiss?.(notif.id)
                          }}
                          className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-accent"
                >
                  View all notifications
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
