const express = require('express')
const { z } = require('zod')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')
const { requirePermission } = require('../middleware/permissions')
const { getVisibilityFilter } = require('../middleware/visibility')
const { logAction } = require('../utils/auditLog')
const { emitToWorkspace } = require('../socket/emitter')
const { sendSlackMessage, createGoalUpdateBlock } = require('../services/slackService')

const router = express.Router()

const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  ownerId: z.string().nullable().optional(),
  recurrenceRule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).nullable().optional(),
})

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().optional(),
  recurrenceRule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).nullable().optional(),
})

router.get('/:workspaceId/goals', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { cursor } = req.query
    const visFilter = getVisibilityFilter(req, 'goal')
    const goals = await prisma.goal.findMany({
      where: { workspaceId: req.params.workspaceId, deletedAt: null, ...visFilter },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { milestones: true, actionItems: true } },
        actionItems: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    const nextCursor = goals.length >= 50 ? goals[49].id : null

    const enriched = goals.map(g => {
      const doneCount = g.actionItems.filter(a => a.status === 'DONE').length
      const totalCount = g.actionItems.length
      const calculatedProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
      return {
        ...g,
        actionItems: undefined,
        progress: calculatedProgress,
      }
    })
    res.json({ data: enriched, nextCursor, message: 'Goals fetched' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:workspaceId/goals', requirePermission('CREATE_GOAL'), async (req, res) => {
  try {
    const { title, description, dueDate, ownerId, recurrenceRule } = createGoalSchema.parse(req.body)
    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId: ownerId || req.userId,
        recurrenceRule: recurrenceRule || null,
        workspaceId: req.params.workspaceId,
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        milestones: { select: { progress: true } },
        _count: { select: { actionItems: true } },
      },
    })
    const avgProgress = goal.milestones.length
      ? Math.round(goal.milestones.reduce((sum, m) => sum + m.progress, 0) / goal.milestones.length)
      : 0
    logAction(req.userId, req.params.workspaceId, 'CREATE', 'Goal', goal.id)
    emitToWorkspace(req.params.workspaceId, 'goal:created', { goal })
    res.status(201).json({ data: { ...goal, avgMilestoneProgress: avgProgress }, message: 'Goal created' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:workspaceId/goals/:goalId', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const visFilter = getVisibilityFilter(req, 'goal')
    const goal = await prisma.goal.findFirst({
      where: { id: req.params.goalId, ...visFilter },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        milestones: true,
        updates: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        actionItems: {
          select: { id: true, title: true, status: true, priority: true, assigneeId: true, assignee: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    })
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' })
    }

    const doneCount = goal.actionItems.filter(a => a.status === 'DONE').length
    const totalCount = goal.actionItems.length
    const calculatedProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

    res.json({ data: { ...goal, progress: calculatedProgress }, message: 'Goal fetched' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:workspaceId/goals/:goalId', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { title, description, status, progress, dueDate, recurrenceRule } = updateGoalSchema.parse(req.body)
    const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId } })
    if (goal.ownerId !== req.userId && req.memberRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    let finalProgress = progress
    if (progress === undefined) {
      const actionItems = await prisma.actionItem.findMany({
        where: { goalId: req.params.goalId },
      })
      const doneCount = actionItems.filter(a => a.status === 'DONE').length
      const totalCount = actionItems.length
      finalProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
    }

    const updated = await prisma.goal.update({
      where: { id: req.params.goalId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(progress !== undefined && { progress: finalProgress }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(recurrenceRule !== undefined && { recurrenceRule }),
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        milestones: true,
        actionItems: { select: { id: true, title: true, status: true, priority: true, assigneeId: true } },
      },
    })

    // Send Slack notification if status changed
    if (status && status !== goal.status) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.params.workspaceId },
        select: { name: true, slackWebhookUrl: true },
      })

      if (workspace?.slackWebhookUrl) {
        const block = createGoalUpdateBlock(updated, workspace.name, status)
        await sendSlackMessage(workspace.slackWebhookUrl, block)
      }
    }

    logAction(req.userId, req.params.workspaceId, 'UPDATE', 'Goal', req.params.goalId)
    emitToWorkspace(req.params.workspaceId, 'goal:updated', { goal: updated })
    res.json({ data: updated, message: 'Goal updated' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:workspaceId/goals/:goalId', requirePermission('DELETE_GOAL'), async (req, res) => {
  try {
    await prisma.goal.update({
      where: { id: req.params.goalId },
      data: { deletedAt: new Date() }
    })
    logAction(req.userId, req.params.workspaceId, 'DELETE', 'Goal', req.params.goalId)
    emitToWorkspace(req.params.workspaceId, 'goal:deleted', { goalId: req.params.goalId })
    res.json({ message: 'Goal deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:workspaceId/goals/:goalId/restore', requirePermission('DELETE_GOAL'), async (req, res) => {
  try {
    const goal = await prisma.goal.update({
      where: { id: req.params.goalId },
      data: { deletedAt: null }
    })
    logAction(req.userId, req.params.workspaceId, 'RESTORE', 'Goal', req.params.goalId)
    emitToWorkspace(req.params.workspaceId, 'goal:restored', { goal })
    res.json({ data: goal, message: 'Goal restored' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:workspaceId/goals/:goalId/updates', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body)
    const update = await prisma.goalUpdate.create({
      data: {
        content,
        goalId: req.params.goalId,
        authorId: req.userId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    })
    logAction(req.userId, req.params.workspaceId, 'CREATE', 'GoalUpdate', update.id)
    emitToWorkspace(req.params.workspaceId, 'goal:updated', { goalId: req.params.goalId, update })
    res.status(201).json({ data: update, message: 'Update posted' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
