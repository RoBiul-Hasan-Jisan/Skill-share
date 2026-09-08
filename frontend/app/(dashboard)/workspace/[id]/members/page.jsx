'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Mail, Shield, Plus, MoreVertical, CheckCircle, Circle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAuthStore } from '@/store/authStore'
import { useOptimistic } from '@/hooks/useOptimistic'
import InviteMemberModal from '@/components/members/InviteMemberModal'
import MemberActions from '@/components/members/MemberActions'
export default function MembersPage() {
  const { id: workspaceId } = useParams()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  const workspaceMembers = useWorkspaceStore((state) => state.members)
  const updateMemberRole = useWorkspaceStore((state) => state.updateMemberRole)
  const updateMemberStatus = useWorkspaceStore((state) => state.updateMemberStatus)
  const updateMember = useWorkspaceStore((state) => state.updateMember)
  const currentUser = useAuthStore((state) => state.user)
  const optimisticUpdate = useOptimistic()

  const currentMember = members.find((m) => {
    if (!currentUser) return false
    if (m.user?.email === currentUser.email) return true
    if (m.id === currentUser.id) return true
    if (m.user?.id === currentUser.id) return true
    return false
  })

  // Show invite button if:
  // 1. Current user is identified as ADMIN
  // 2. OR there's at least one ADMIN in the workspace
  // 3. OR there are no members yet (let first user invite others)
  const isAdmin = currentMember?.role === 'ADMIN' || members.some(m => m.role === 'ADMIN') || members.length === 0

  useEffect(() => {
    if (!workspaceId) return
    fetchMembers()
  }, [workspaceId])

  async function fetchMembers() {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/members`)
      setMembers(res.data.data)
      useWorkspaceStore.setState({ members: res.data.data })
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleChangeRole(memberId, newRole) {
    if (!isAdmin) {
      toast.error('Only admins can change roles')
      return
    }

    const memberIndex = members.findIndex((m) => m.id === memberId)
    if (memberIndex === -1) {
      toast.error('Member not found')
      return
    }

    const oldMember = { ...members[memberIndex] }

    try {
      await optimisticUpdate(
        () => {
          const snapshot = [...members]
          setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
          updateMemberRole(memberId, newRole)
          return snapshot
        },
        async () => {
          const res = await api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role: newRole })
        },
        (snapshot) => {
          setMembers(snapshot)
          updateMember(memberId, oldMember)
        }
      )
      toast.success(`Role changed to ${newRole}`)
    } catch (error) {
      toast.error('Failed to change role: ' + (error.response?.data?.error || error.message))
    }
  }

  async function handleChangeStatus(memberId, isActive) {
    if (!isAdmin) {
      toast.error('Only admins can change member status')
      return
    }

    const memberIndex = members.findIndex((m) => m.id === memberId)
    const oldMember = members[memberIndex]

    try {
      await optimisticUpdate(
        () => {
          const snapshot = [...members]
          setMembers(members.map((m) => (m.id === memberId ? { ...m, isActive } : m)))
          updateMemberStatus(memberId, isActive)
          return snapshot
        },
        async () => {
          await api.patch(`/workspaces/${workspaceId}/members/${memberId}/status`, { isActive })
        },
        (snapshot) => {
          setMembers(snapshot)
          updateMember(memberId, oldMember)
        }
      )
      toast.success(isActive ? 'Member activated' : 'Member deactivated')
    } catch (error) {
      console.error('Failed to change status:', error)
    }
  }

  async function handleRemoveMember(memberId) {
    if (!isAdmin) {
      toast.error('Only admins can remove members')
      return
    }

    if (memberId === currentMember?.id) {
      toast.error('You cannot remove yourself')
      return
    }

    const snapshot = [...members]
    try {
      await optimisticUpdate(
        () => {
          setMembers(members.filter((m) => m.id !== memberId))
          useWorkspaceStore.setState({ members: members.filter((m) => m.id !== memberId) })
          return snapshot
        },
        async () => {
          await api.delete(`/workspaces/${workspaceId}/members/${memberId}`)
        },
        (prevSnapshot) => {
          setMembers(prevSnapshot)
        }
      )
      toast.success('Member removed')
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.23, ease: 'easeOut' } },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary mb-2">
            Members
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary">
            Manage workspace members, roles, and permissions
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInviteModal(true)} className="gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </motion.div>

      {/* Members List */}
      <motion.div
        className="bg-surface border border-border rounded-xl overflow-hidden"
        variants={itemVariants}
      >
        <div className="px-4 sm:px-6 py-4 border-b border-border bg-surface-2">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            {members.length} Members
          </h2>
        </div>

        <div className="divide-y divide-border overflow-x-auto">
          <AnimatePresence>
            {members.map((member) => (
              <motion.div
                key={member.id}
                variants={itemVariants}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors relative min-w-max sm:min-w-0"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm sm:text-lg">
                      {member.user?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary text-sm sm:text-base">{member.user?.name}</h3>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-text-muted">
                      <Mail className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{member.user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-end">
                  {/* Active Status */}
                  <div className="flex items-center gap-2">
                    {member.isActive ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-xs sm:text-sm font-medium text-text-primary">
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center gap-2 min-w-fit">
                    <Shield className="w-4 h-4 text-accent" />
                    <span className="text-xs sm:text-sm font-medium text-text-primary uppercase tracking-wider">
                      {member.role}
                    </span>
                  </div>

                  {/* Actions (Admin Only) */}
                  {isAdmin && member.id !== currentMember?.id && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                        className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-text-muted" />
                      </button>
                      <AnimatePresence>
                        {openMenuId === member.id && (
                          <MemberActions key={member.id + '-actions'}
                            member={member}
                            onChangeRole={handleChangeRole}
                            onChangeStatus={handleChangeStatus}
                            onRemove={handleRemoveMember}
                            onClose={() => setOpenMenuId(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteMemberModal
            workspaceId={workspaceId}
            onClose={() => setShowInviteModal(false)}
            onSuccess={(newMember) => {
              setMembers([...members, newMember])
              useWorkspaceStore.setState({ members: [...members, newMember] })
              setShowInviteModal(false)
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
