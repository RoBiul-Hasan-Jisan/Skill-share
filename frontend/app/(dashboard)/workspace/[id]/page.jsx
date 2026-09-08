'use client'

import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { motion } from 'framer-motion'
import { Users, ListChecks, Target, Clock } from 'lucide-react'
import { Badge } from '@/components/ui'
import api from '@/lib/api'

export default function WorkspacePage() {
  const { activeWorkspace } = useWorkspaceStore()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!activeWorkspace?.id) return
    const fetchStats = async () => {
      try {
        const [goalsRes, membersRes] = await Promise.all([
          api.get(`/workspaces/${activeWorkspace.id}/goals`),
          api.get(`/workspaces/${activeWorkspace.id}/members`),
        ])
        setStats({
          activeGoals: goalsRes.data.data.filter((g) => g.status !== 'COMPLETED').length,
          members: membersRes.data.data.length,
          totalGoals: goalsRes.data.data.length,
        })
      } catch (e) {
        console.error('Failed to fetch workspace stats', e)
      }
    }
    fetchStats()
  }, [activeWorkspace?.id])

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-96 text-text-muted">
        Select a workspace to get started
      </div>
    )
  }

  const daysLeft = activeWorkspace.deadline
    ? Math.ceil((new Date(activeWorkspace.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const taskTotal = activeWorkspace.taskCounts
    ? Object.values(activeWorkspace.taskCounts).reduce((a, b) => a + b, 0)
    : activeWorkspace._count?.actionItems || 0

  const statusBadgeVariant = activeWorkspace.status === 'COMPLETED' ? 'completed' : 'default'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  }

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{activeWorkspace.name}</h1>
          <Badge variant={statusBadgeVariant} size="sm">
            {activeWorkspace.status === 'ACTIVE'
              ? 'Active'
              : activeWorkspace.status === 'ON_HOLD'
                ? 'On Hold'
                : 'Completed'}
          </Badge>
        </div>
        {activeWorkspace.description && (
          <p className="text-text-secondary text-lg">{activeWorkspace.description}</p>
        )}
        {daysLeft !== null && (
          <div className={`flex items-center gap-1.5 text-sm mt-2 ${daysLeft <= 0 ? 'text-red-400' : 'text-text-muted'}`}>
            <Clock className="w-4 h-4" />
            {daysLeft <= 0
              ? `Overdue by ${Math.abs(daysLeft)} days`
              : daysLeft === 1
                ? 'Due tomorrow'
                : `Due in ${daysLeft} days`}
            — {new Date(activeWorkspace.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Users className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary">{stats?.members ?? activeWorkspace._count?.members ?? '—'}</div>
          <div className="text-sm text-text-muted mt-1">Members</div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <ListChecks className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary">{taskTotal}</div>
          <div className="text-sm text-text-muted mt-1">Tasks</div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Target className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary">{stats?.activeGoals ?? '—'}</div>
          <div className="text-sm text-text-muted mt-1">Active Goals</div>
        </motion.div>
      </motion.div>

      {/* Task Status Breakdown */}
      {activeWorkspace.taskCounts && (
        <motion.div variants={itemVariants}>
          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Task Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'To Do', key: 'TODO', color: 'bg-gray-400' },
                { label: 'In Progress', key: 'IN_PROGRESS', color: 'bg-blue-500' },
                { label: 'In Review', key: 'IN_REVIEW', color: 'bg-purple-500' },
                { label: 'Done', key: 'DONE', color: 'bg-green-500' },
              ].map(({ label, key, color }) => (
                <div key={key} className="text-center p-3 bg-surface-2 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">
                    {activeWorkspace.taskCounts[key] || 0}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-xs text-text-muted">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
