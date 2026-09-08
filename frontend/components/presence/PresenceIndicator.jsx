'use client'

import { Avatar } from '@/components/ui'
import { Tooltip } from '@/components/ui'

export function PresenceIndicator({
  member,
  isOnline = false,
  lastSeen = null,
}) {
  const formatLastSeen = (date) => {
    if (!date) return 'Unknown'
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

  const tooltipText = isOnline
    ? `${member.user?.name} is online`
    : `${member.user?.name} was active ${formatLastSeen(lastSeen)}`

  return (
    <Tooltip text={tooltipText}>
      <div className="relative inline-block">
        <Avatar
          src={member.user?.avatarUrl}
          name={member.user?.name}
          size="md"
          isOnline={isOnline}
        />
      </div>
    </Tooltip>
  )
}
