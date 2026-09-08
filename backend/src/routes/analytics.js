const express = require('express')
const { Parser } = require('json2csv')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')

const router = express.Router()

router.get('/:workspaceId/analytics', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { workspaceId } = req.params

    const goals = await prisma.goal.findMany({
      where: { workspaceId },
      include: { actionItems: true },
    })

    const actions = await prisma.actionItem.findMany({
      where: { workspaceId },
    })

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const completedThisWeek = actions.filter(a => a.updatedAt > oneWeekAgo && a.status === 'DONE').length

    const overdueActions = actions.filter(a => a.dueDate && a.dueDate < new Date() && a.status !== 'DONE').length
    const overdueGoals = goals.filter(g => g.dueDate && g.dueDate < new Date() && g.status !== 'COMPLETED').length

    const statusCounts = {
      onTrack: goals.filter(g => g.status === 'ON_TRACK').length,
      atRisk: goals.filter(g => g.status === 'AT_RISK').length,
      behind: goals.filter(g => g.status === 'BEHIND').length,
      completed: goals.filter(g => g.status === 'COMPLETED').length,
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true } } },
    })

    const memberActivity = await Promise.all(
      members.map(async m => ({
        userId: m.userId,
        name: m.user.name,
        actionsCompleted: actions.filter(
          a => a.assigneeId === m.userId && a.updatedAt > oneWeekAgo && a.status === 'DONE'
        ).length,
      }))
    )

    const last8Weeks = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (7 - i) * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      return weekStart
    })

    const goalCompletionByWeek = last8Weeks.map(weekStart => {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const completed = goals.filter(
        g => g.updatedAt >= weekStart && g.updatedAt < weekEnd && g.status === 'COMPLETED'
      ).length
      return {
        week: weekStart.toISOString().split('T')[0],
        completed,
      }
    })

    res.json({
      data: {
        totalGoals: goals.length,
        goalsOnTrack: statusCounts.onTrack,
        goalsAtRisk: statusCounts.atRisk,
        goalsBehind: statusCounts.behind,
        goalsCompleted: statusCounts.completed,
        actionsCompletedThisWeek: completedThisWeek,
        overdueActions,
        overdueGoals,
        goalCompletionByWeek,
        memberActivity,
      },
      message: 'Analytics fetched',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:workspaceId/analytics/export', requireRole('ADMIN', 'MODERATOR'), async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: { owner: { select: { name: true } } },
    })

    const actions = await prisma.actionItem.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: { assignee: { select: { name: true } } },
    })

    const csvData = [
      ...goals.map(g => ({
        type: 'Goal',
        title: g.title,
        status: g.status,
        priority: '-',
        assignee: g.owner?.name || '',
        dueDate: g.dueDate ? g.dueDate.toISOString().split('T')[0] : '',
        createdAt: g.createdAt.toISOString().split('T')[0],
      })),
      ...actions.map(a => ({
        type: 'Action',
        title: a.title,
        status: a.status,
        priority: a.priority,
        assignee: a.assignee?.name || '',
        dueDate: a.dueDate ? a.dueDate.toISOString().split('T')[0] : '',
        createdAt: a.createdAt.toISOString().split('T')[0],
      })),
    ]

    const csv = new Parser().parse(csvData)

    res.json({ csv })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
