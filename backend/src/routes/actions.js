const express = require('express')
const { z } = require('zod')
const prisma = require('../prisma/client')
const { logAction } = require('../utils/auditLog')
const { emitToWorkspace } = require('../socket/emitter')
const { sendAssignmentEmail } = require('../services/emailService')
const { sendSlackMessage, createActionAssignmentBlock } = require('../services/slackService')
const { requireRole } = require('../middleware/rbac')
const { requirePermission } = require('../middleware/permissions')
const { getVisibilityFilter } = require('../middleware/visibility')

const router = express.Router()

const createActionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().nullable().optional(),
  goalId: z.string().nullable().optional(),
  dueDate: z.string().optional(),
  recurrenceRule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).nullable().optional(),
})

const updateActionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().optional(),
  recurrenceRule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).nullable().optional(),
})

router.get('/:workspaceId/actions', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { status, assigneeId, goalId, cursor } = req.query
    const visFilter = getVisibilityFilter(req, 'action')
    const where = { workspaceId: req.params.workspaceId, deletedAt: null, ...visFilter }
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    if (goalId) where.goalId = goalId

    const actions = await prisma.actionItem.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        goal: { select: { id: true, title: true } },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
      take: 50,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    const nextCursor = actions.length >= 50 ? actions[49].id : null

    res.json({ data: actions.slice(0, 50), nextCursor, message: 'Actions fetched' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:workspaceId/actions', requirePermission('CREATE_ACTION'), async (req, res) => {
  try {
    const { title, description, priority, assigneeId, goalId, dueDate, recurrenceRule } = createActionSchema.parse(req.body)

    if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) {
      return res.status(400).json({ error: 'Please select a valid deadline.' })
    }

    const existing = await prisma.actionItem.findFirst({
      where: { title, workspaceId: req.params.workspaceId, deletedAt: null },
    })
    if (existing) {
      return res.status(409).json({ error: 'This task already exists in the project.' })
    }

    const assigner = await prisma.user.findUnique({ where: { id: req.userId } })
    const workspace = await prisma.workspace.findUnique({ where: { id: req.params.workspaceId } })

    const action = await prisma.$transaction(async (tx) => {
      const newAction = await tx.actionItem.create({
        data: {
          title,
          description,
          priority: priority || 'MEDIUM',
          assigneeId,
          goalId,
          dueDate: dueDate ? new Date(dueDate) : null,
          recurrenceRule: recurrenceRule || null,
          workspaceId: req.params.workspaceId,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          goal: { select: { id: true, title: true } },
        },
      })

      if (assigneeId) {
        await tx.notification.create({
          data: {
            userId: assigneeId,
            type: 'ACTION_ASSIGNED',
            message: `${assigner?.name || 'Team member'} assigned you to "${newAction.title}"`,
            link: `/workspace/${req.params.workspaceId}/actions`,
          },
        })
      }

      return newAction
    })

    if (assigneeId && action.assignee?.email) {
      const actionLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/workspace/${req.params.workspaceId}/actions`
      await sendAssignmentEmail(
        action.assignee.email,
        assigner?.name || 'Team member',
        action.title,
        workspace?.name || 'Workspace',
        actionLink
      )
    }

    logAction(req.userId, req.params.workspaceId, 'CREATE', 'ActionItem', action.id)
    emitToWorkspace(req.params.workspaceId, 'action:created', { action })
    res.status(201).json({ data: action, message: 'Action created' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:workspaceId/actions/:actionId', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { title, description, priority, status, progress, assigneeId, dueDate, recurrenceRule } = updateActionSchema.parse(req.body)

    const existingAction = await prisma.actionItem.findUnique({
      where: { id: req.params.actionId },
      include: { assignee: true },
    })

    if (title && title !== existingAction.title) {
      const dup = await prisma.actionItem.findFirst({
        where: { title, workspaceId: req.params.workspaceId, deletedAt: null, id: { not: req.params.actionId } },
      })
      if (dup) {
        return res.status(409).json({ error: 'This task already exists in the project.' })
      }
    }

    if (existingAction.status === 'DONE' && assigneeId !== undefined && assigneeId !== existingAction.assigneeId) {
      return res.status(400).json({ error: 'Completed tasks cannot be reassigned.' })
    }

    if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) {
      return res.status(400).json({ error: 'Please select a valid deadline.' })
    }

    const action = await prisma.actionItem.update({
      where: { id: req.params.actionId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(progress !== undefined && { progress }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(recurrenceRule !== undefined && { recurrenceRule }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        goal: { select: { id: true, title: true } },
      },
    })

    if (assigneeId !== undefined && assigneeId !== existingAction.assigneeId && assigneeId) {
      const assigner = await prisma.user.findUnique({ where: { id: req.userId } })
      const workspace = await prisma.workspace.findUnique({ where: { id: req.params.workspaceId }, select: { name: true, slackWebhookUrl: true } })

      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: 'ACTION_ASSIGNED',
          message: `${assigner?.name || 'Team member'} assigned you to "${action.title}"`,
          link: `/workspace/${req.params.workspaceId}/actions`,
        },
      })

      if (action.assignee?.email) {
        const actionLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/workspace/${req.params.workspaceId}/actions`
        await sendAssignmentEmail(
          action.assignee.email,
          assigner?.name || 'Team member',
          action.title,
          workspace?.name || 'Workspace',
          actionLink
        )
      }

      if (workspace?.slackWebhookUrl && action.assignee?.name) {
        const block = createActionAssignmentBlock(action, action.assignee.name, workspace.name)
        await sendSlackMessage(workspace.slackWebhookUrl, block)
      }

      emitToWorkspace(req.params.workspaceId, 'action:assigned', {
        actionId: action.id,
        assigneeId: assigneeId,
        actionTitle: action.title,
      })
    }

    logAction(req.userId, req.params.workspaceId, 'UPDATE', 'ActionItem', req.params.actionId)
    emitToWorkspace(req.params.workspaceId, 'action:updated', { action })
    res.json({ data: action, message: 'Action updated' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:workspaceId/actions/:actionId', requirePermission('DELETE_ACTION'), async (req, res) => {
  try {
    await prisma.actionItem.update({
      where: { id: req.params.actionId },
      data: { deletedAt: new Date() }
    })
    logAction(req.userId, req.params.workspaceId, 'DELETE', 'ActionItem', req.params.actionId)
    emitToWorkspace(req.params.workspaceId, 'action:deleted', { actionId: req.params.actionId })
    res.json({ message: 'Action deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:workspaceId/actions/:actionId/restore', requirePermission('DELETE_ACTION'), async (req, res) => {
  try {
    const action = await prisma.actionItem.update({
      where: { id: req.params.actionId },
      data: { deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        goal: { select: { id: true, title: true } },
      },
    })
    logAction(req.userId, req.params.workspaceId, 'RESTORE', 'ActionItem', req.params.actionId)
    emitToWorkspace(req.params.workspaceId, 'action:restored', { action })
    res.json({ data: action, message: 'Action restored' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:workspaceId/actions/reorder', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { updates } = z.object({
      updates: z.array(z.object({
        id: z.string(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
        position: z.number().optional(),
      }))
    }).parse(req.body)

    const results = await Promise.all(
      updates.map(update =>
        prisma.actionItem.update({
          where: { id: update.id },
          data: {
            ...(update.status && { status: update.status }),
            ...(update.position !== undefined && { position: update.position }),
          },
          include: {
            assignee: { select: { id: true, name: true, avatarUrl: true } },
          },
        })
      )
    )

    logAction(req.userId, req.params.workspaceId, 'REORDER', 'ActionItem', 'batch')
    emitToWorkspace(req.params.workspaceId, 'action:moved', { actions: results })
    res.json({ data: results, message: 'Actions reordered' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:workspaceId/actions/bulk', requirePermission('CREATE_ACTION'), async (req, res) => {
  try {
    const { ids, operation, payload } = z.object({
      ids: z.array(z.string()).min(1),
      operation: z.enum(['update', 'delete', 'restore']),
      payload: z.record(z.any()).optional(),
    }).parse(req.body)

    const actions = await prisma.actionItem.findMany({
      where: {
        id: { in: ids },
        workspaceId: req.params.workspaceId,
      },
      select: { id: true, workspaceId: true },
    })

    if (actions.length !== ids.length) {
      return res.status(404).json({ error: 'Some actions not found' })
    }

    const results = await prisma.$transaction(async (tx) => {
      if (operation === 'update') {
        return await Promise.all(
          ids.map(id =>
            tx.actionItem.update({
              where: { id },
              data: payload || {},
              include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
            })
          )
        )
      } else if (operation === 'delete') {
        return await Promise.all(
          ids.map(id =>
            tx.actionItem.update({
              where: { id },
              data: { deletedAt: new Date() },
            })
          )
        )
      } else if (operation === 'restore') {
        return await Promise.all(
          ids.map(id =>
            tx.actionItem.update({
              where: { id },
              data: { deletedAt: null },
              include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
            })
          )
        )
      }
    })

    logAction(req.userId, req.params.workspaceId, operation.toUpperCase(), 'ActionItem', 'batch')
    emitToWorkspace(req.params.workspaceId, 'action:bulk', { operation, count: ids.length })
    res.json({ data: results, message: `${ids.length} actions ${operation}d` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
