const express = require('express')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')
const { logAction } = require('../utils/auditLog')
const { emitToWorkspace } = require('../socket/emitter')

const router = express.Router()

// Get all soft-deleted items for a workspace
router.get('/:workspaceId/trash', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId

    // Auto-purge: delete items older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    await Promise.all([
      prisma.goal.deleteMany({
        where: {
          workspaceId,
          deletedAt: { lt: sevenDaysAgo, not: null }
        }
      }),
      prisma.actionItem.deleteMany({
        where: {
          workspaceId,
          deletedAt: { lt: sevenDaysAgo, not: null }
        }
      }),
      prisma.announcement.deleteMany({
        where: {
          workspaceId,
          deletedAt: { lt: sevenDaysAgo, not: null }
        }
      })
    ])

    // Fetch remaining soft-deleted items
    const [goals, actions, announcements] = await Promise.all([
      prisma.goal.findMany({
        where: { workspaceId, deletedAt: { not: null } },
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.actionItem.findMany({
        where: { workspaceId, deletedAt: { not: null } },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          goal: { select: { id: true, title: true } },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.announcement.findMany({
        where: { workspaceId, deletedAt: { not: null } },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { deletedAt: 'desc' },
      })
    ])

    res.json({
      data: {
        goals,
        actions,
        announcements,
      },
      message: 'Trash fetched'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Permanently delete an item (hard delete)
router.delete('/:workspaceId/trash/goals/:goalId', requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.goal.delete({ where: { id: req.params.goalId } })
    logAction(req.userId, req.params.workspaceId, 'PURGE', 'Goal', req.params.goalId)
    emitToWorkspace(req.params.workspaceId, 'goal:purged', { goalId: req.params.goalId })
    res.json({ message: 'Goal permanently deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:workspaceId/trash/actions/:actionId', requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.actionItem.delete({ where: { id: req.params.actionId } })
    logAction(req.userId, req.params.workspaceId, 'PURGE', 'ActionItem', req.params.actionId)
    emitToWorkspace(req.params.workspaceId, 'action:purged', { actionId: req.params.actionId })
    res.json({ message: 'Action permanently deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:workspaceId/trash/announcements/:annId', requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.annId } })
    logAction(req.userId, req.params.workspaceId, 'PURGE', 'Announcement', req.params.annId)
    emitToWorkspace(req.params.workspaceId, 'announcement:purged', { announcementId: req.params.annId })
    res.json({ message: 'Announcement permanently deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
