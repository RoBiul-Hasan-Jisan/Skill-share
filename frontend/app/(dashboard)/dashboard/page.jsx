'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useNotificationStore } from '@/store/notificationStore'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import { Zap, Target, Users, Bell, ChevronRight, Clock, ListChecks } from 'lucide-react'
import { Badge } from '@/components/ui'
import {
  DashboardGoalsModal,
  DashboardMembersModal,
  DashboardNotificationsModal,
  DashboardWorkspacesModal,
} from '@/components/dashboard/DashboardModals'
import Link from 'next/link'
import { CreateWorkspaceModal } from '@/components/dashboard/CreateWorkspaceModal'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { workspaces, activeWorkspace } = useWorkspaceStore()
  const { notifications } = useNotificationStore()
  const [openModal, setOpenModal] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState([
    { label: 'Total Workspaces', value: '—', icon: Zap },
    { label: 'Active Goals', value: '—', icon: Target },
    { label: 'Team Members', value: '—', icon: Users },
    { label: 'Notifications', value: '—', icon: Bell },
  ])

  useEffect(() => {
    if (!activeWorkspace?.id) return

    const fetchStats = async () => {
      try {
        const [goalsRes, membersRes] = await Promise.all([
          api.get(`/workspaces/${activeWorkspace.id}/goals`),
          api.get(`/workspaces/${activeWorkspace.id}/members`),
        ])

        const activeGoals = goalsRes.data.data.filter((g) => g.status !== 'COMPLETED').length
        const memberCount = membersRes.data.data.length

        setStats([
          { label: 'Total Workspaces', value: workspaces.length.toString(), icon: Zap },
          { label: 'Active Goals', value: activeGoals.toString(), icon: Target },
          { label: 'Team Members', value: memberCount.toString(), icon: Users },
          { label: 'Notifications', value: notifications.length.toString(), icon: Bell },
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      }
    }

    fetchStats()
  }, [activeWorkspace?.id, workspaces.length, notifications.length])

  const cardModalMap = {
    'Total Workspaces': 'workspaces',
    'Active Goals': 'goals',
    'Team Members': 'members',
    'Notifications': 'notifications',
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-2">
          Welcome back to dashboard {user?.name || 'User'} 👋
        </h1>
        <p className="text-text-secondary text-lg">
          Here&apos;s what&apos;s happening in your workspace today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group cursor-pointer"
              onClick={() => setOpenModal(cardModalMap[stat.label])}
            >
              <div className="bg-surface border border-border rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-text-muted uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div className="p-2 rounded-lg bg-surface">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-text-primary">
                  {stat.value}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-muted">+0 this week</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Workspace Cards or Create CTA */}
      {workspaces.length > 0 ? (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">All Workspaces</h2>
            <Link
              href={workspaces[0]?.id ? `/workspace/${workspaces[0].id}/settings` : '#'}
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => {
              const daysLeft = ws.deadline
                ? Math.ceil((new Date(ws.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                : null
              const taskTotal = ws.taskCounts
                ? Object.values(ws.taskCounts).reduce((a, b) => a + b, 0)
                : 0
              return (
                <Link key={ws.id} href={`/workspace/${ws.id}`}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all h-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ws.accentColor || '#6366F1' }}
                        />
                        <h3 className="font-semibold text-text-primary truncate">{ws.name}</h3>
                      </div>
                      <Badge
                        variant={ws.status === 'COMPLETED' ? 'completed' : 'default'}
                        size="sm"
                      >
                        {ws.status === 'ACTIVE' ? (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Active
                          </span>
                        ) : ws.status === 'ON_HOLD' ? (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                            On Hold
                          </span>
                        ) : (
                          'Completed'
                        )}
                      </Badge>
                    </div>

                    {ws.description && (
                      <p className="text-sm text-text-muted line-clamp-2 mb-3">{ws.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-text-muted mt-auto pt-2 border-t border-border">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {ws._count?.members || 0} members
                      </span>
                      <span className="flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" />
                        {taskTotal} tasks
                      </span>
                      {daysLeft !== null && (
                        <span className={`flex items-center gap-1 ml-auto ${daysLeft <= 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-400' : ''}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {daysLeft <= 0
                            ? 'Overdue'
                            : daysLeft === 1
                              ? '1 day left'
                              : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="bg-surface border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-text-primary mb-3">
              You haven&apos;t created any workspaces yet
            </h2>
            <p className="text-text-secondary max-w-md mx-auto mb-8">
              Workspaces are where your team collaborates on goals, tracks actions, and stays aligned.
              Create your first workspace to get started.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Create Workspace
            </button>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-6">Recent Activity</h2>
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <div className="text-text-muted text-lg mb-2">No activity yet</div>
              <p className="text-text-secondary text-sm">
                {workspaces.length === 0
                  ? 'Create a workspace to start collaborating with your team'
                  : 'Start by creating a goal or inviting team members'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {openModal === 'goals' && (
        <DashboardGoalsModal
          workspaceId={activeWorkspace?.id}
          isOpen
          onClose={() => setOpenModal(null)}
          currentUser={user}
        />
      )}
      {openModal === 'members' && (
        <DashboardMembersModal
          workspaceId={activeWorkspace?.id}
          isOpen
          onClose={() => setOpenModal(null)}
          currentUser={user}
        />
      )}
      {openModal === 'notifications' && (
        <DashboardNotificationsModal
          isOpen
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'workspaces' && (
        <DashboardWorkspacesModal
          isOpen
          onClose={() => setOpenModal(null)}
          currentUser={user}
        />
      )}

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </motion.div>
  )
}
