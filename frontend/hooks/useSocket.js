'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useGoalStore } from '@/store/goalStore'
import { useActionStore } from '@/store/actionStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuthStore } from '@/store/authStore'

let socket = null

export function useSocket() {
  const { activeWorkspace } = useWorkspaceStore()
  const { user, token } = useAuthStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!activeWorkspace?.id || !user?.id) return

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'
    if (!token) return
    socket = io(socketUrl, {
      auth: { token },
      query: {
        workspaceId: activeWorkspace.id,
      },
    })

    // Goal events
    socket.on('goal:created', (data) => {
      toast.success(`Goal created: ${data.goal?.title || 'New goal'}`)
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'GOAL_CREATED',
        message: `New goal: ${data.goal?.title}`,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/workspace/${activeWorkspace.id}/goals`,
      })
    })

    socket.on('goal:deleted', (data) => {
      toast('Goal moved to trash', { icon: '🗑️' })
    })

    socket.on('goal:restored', (data) => {
      toast.success(`Goal restored: ${data.goal?.title}`)
    })

    socket.on('goal:updated', (data) => {
      // Silent update - no toast needed
    })

    // Action events
    socket.on('action:created', (data) => {
      toast.success(`Action created: ${data.action?.title || 'New action'}`)
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'ACTION_CREATED',
        message: `New action: ${data.action?.title}`,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/workspace/${activeWorkspace.id}/actions`,
      })
    })

    socket.on('action:assigned', (data) => {
      if (data.action?.assigneeId === user.id) {
        toast.success(`You were assigned: ${data.action?.title}`)
        addNotification({
          id: `notif-${Date.now()}`,
          type: 'ACTION_ASSIGNED',
          message: `You were assigned to: ${data.action?.title}`,
          read: false,
          createdAt: new Date().toISOString(),
          link: `/workspace/${activeWorkspace.id}/actions`,
        })
      }
    })

    socket.on('action:deleted', (data) => {
      toast('Action moved to trash', { icon: '🗑️' })
    })

    socket.on('action:restored', (data) => {
      toast.success(`Action restored: ${data.action?.title}`)
    })

    socket.on('action:updated', (data) => {
      // Silent update
    })

    // Announcement events
    socket.on('announcement:new', (data) => {
      toast.success(`New announcement: ${data.announcement?.title}`)
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'ANNOUNCEMENT',
        message: `New announcement: ${data.announcement?.title}`,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/workspace/${activeWorkspace.id}/announcements`,
      })
    })

    socket.on('announcement:deleted', (data) => {
      toast('Announcement moved to trash', { icon: '🗑️' })
    })

    socket.on('announcement:restored', (data) => {
      toast.success(`Announcement restored`)
    })

    socket.on('announcement:pinned', (data) => {
      toast(`Announcement ${data.isPinned ? 'pinned' : 'unpinned'}`)
    })

    socket.on('announcement:updated', (data) => {
      // Silent update
    })

    // Member events
    socket.on('member:joined', (data) => {
      toast.success('A new member joined the workspace')
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'MEMBER_JOINED',
        message: 'A new member joined',
        read: false,
        createdAt: new Date().toISOString(),
        link: `/workspace/${activeWorkspace.id}/members`,
      })
    })

    socket.on('member:removed', (data) => {
      toast('A member was removed from the workspace')
    })

    socket.on('member:role-changed', (data) => {
      toast(`Member role changed to ${data.role}`)
    })

    socket.on('member:status-changed', (data) => {
      toast(data.isActive ? 'Member activated' : 'Member deactivated')
    })

    // Comment events
    socket.on('comment:new', (data) => {
      if (data.comment?.authorId !== user.id) {
        addNotification({
          id: `notif-${Date.now()}`,
          type: 'COMMENT',
          message: `New comment from ${data.comment?.author?.name || 'Someone'}`,
          read: false,
          createdAt: new Date().toISOString(),
        })
      }
    })

    // Mention/notification events
    socket.on('notification:new', (data) => {
      if (data.notification) {
        addNotification({
          id: data.notification.id,
          type: data.notification.type || 'MENTION',
          message: data.notification.message,
          read: false,
          createdAt: data.notification.createdAt,
          link: data.notification.link,
        })
      }
    })

    // Presence updates (silent)
    socket.on('presence:update', (data) => {
      // No toast for presence updates
    })

    // Reaction events
    socket.on('reaction:toggled', (data) => {
      // Silent - only toast if it's the current user
    })

    // Settings events
    socket.on('workspace:updated', (data) => {
      toast.info(`Workspace updated: ${data.workspace?.name}`)
    })

    socket.on('user:profile-updated', (data) => {
      if (data.user?.id !== user.id) {
        toast.info(`${data.user?.name}'s profile was updated`)
      }
    })

    socket.on('member:invited', (data) => {
      toast.success(`${data.member?.user?.name} was invited to the workspace`)
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'MEMBER_INVITED',
        message: `${data.member?.user?.name} was invited`,
        read: false,
        createdAt: new Date().toISOString(),
        link: `/workspace/${activeWorkspace.id}/members`,
      })
    })

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [activeWorkspace?.id, user?.id, addNotification])

  return socket
}
