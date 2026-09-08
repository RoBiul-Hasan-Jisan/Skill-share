'use client'

import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAuthStore } from '@/store/authStore'
import { PERMISSIONS } from '@/lib/permissions'

export function usePermission() {
  const { activeWorkspace, members } = useWorkspaceStore()
  const { user } = useAuthStore()

  if (!activeWorkspace || !user) {
    return {
      can: () => false,
      role: null,
      isAdmin: false,
    }
  }

  const member = members.find((m) => m.userId === user.id)
  const role = member?.role || null

  return {
    can: (permission) => {
      if (!role) return false
      return PERMISSIONS[permission]?.includes(role) ?? false
    },
    role,
    isAdmin: role === 'ADMIN',
  }
}
