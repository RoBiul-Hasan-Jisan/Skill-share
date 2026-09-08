'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, Users, Target, X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui'
import api from '@/lib/api'

export default function AnalyticsPage() {
  const { id: workspaceId } = useParams()
  const [selectedStat, setSelectedStat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/workspaces/${workspaceId}/analytics`)
        setAnalytics(res.data.data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    if (workspaceId) fetchAnalytics()
  }, [workspaceId])

  const stats = analytics ? [
    { label: 'Goals Completed', value: analytics.goalsCompleted, total: analytics.totalGoals, icon: Target, key: 'goals' },
    { label: 'Actions Completed', value: analytics.actionsCompletedThisWeek, total: '-', icon: TrendingUp, key: 'actions' },
    { label: 'Overdue Actions', value: analytics.overdueActions, total: '-', icon: BarChart3, key: 'overdue-actions' },
    { label: 'Overdue Goals', value: analytics.overdueGoals, total: '-', icon: Users, key: 'overdue-goals' },
  ] : []

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 bg-surface-2 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div className="space-y-8" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants}>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary mb-2">
          Analytics
        </h1>
        <p className="text-sm sm:text-lg text-text-secondary">Track your workspace performance and progress</p>
      </motion.div>

      {!analytics || (analytics.totalGoals === 0 && analytics.actionsCompletedThisWeek === 0 && analytics.overdueActions === 0 && analytics.overdueGoals === 0) ? (
        <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary mb-3">
            No analytics yet
          </h2>
          <p className="text-text-secondary max-w-md mx-auto mb-2">
            Analytics will populate as your team creates goals, completes actions, and tracks progress.
          </p>
          <p className="text-text-muted text-sm max-w-md mx-auto mb-8">
            Here&apos;s what you&apos;ll see: goals completed, actions completed this week, overdue items, member activity, and goal status breakdowns.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/workspace/${workspaceId}/goals`}
              className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Create a Goal
            </Link>
            <Link
              href={`/workspace/${workspaceId}/actions`}
              className="px-6 py-3 bg-surface-2 text-text-primary rounded-lg font-semibold hover:bg-border transition-colors"
            >
              Create an Action
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedStat(stat.key)}
                  className="cursor-pointer"
                >
                  <div className="bg-surface border border-border rounded-xl p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-text-muted uppercase tracking-wider">{stat.label}</span>
                      <div className="p-2 rounded-lg bg-surface"><Icon className="w-5 h-5 text-accent" /></div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-text-primary">{stat.value}</span>
                      <span className="text-sm text-text-muted">/ {stat.total}</span>
                    </div>
                    <div className="mt-4 w-full bg-surface-2 rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: `${Math.min((stat.value / (parseInt(stat.total) || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Goal Status Breakdown */}
          <motion.div variants={itemVariants}>
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-text-primary mb-6">Goal Status Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'On Track', value: analytics.goalsOnTrack, color: 'bg-green-500' },
                  { label: 'At Risk', value: analytics.goalsAtRisk, color: 'bg-yellow-500' },
                  { label: 'Behind', value: analytics.goalsBehind, color: 'bg-orange-500' },
                  { label: 'Completed', value: analytics.goalsCompleted, color: 'bg-blue-500' },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-surface-2 rounded-lg text-center">
                    <div className={`w-3 h-3 rounded-full ${item.color} mx-auto mb-2`} />
                    <p className="text-2xl font-bold text-text-primary">{item.value}</p>
                    <p className="text-xs text-text-muted mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Member Activity */}
          {analytics.memberActivity?.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold text-text-primary mb-6">Member Activity (This Week)</h2>
                <div className="space-y-3">
                  {analytics.memberActivity.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                      <span className="text-sm font-medium text-text-primary">{member.name}</span>
                      <span className="text-sm text-text-muted">{member.actionsCompleted} actions completed</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
