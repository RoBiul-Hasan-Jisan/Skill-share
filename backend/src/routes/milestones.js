const express = require('express')
const { z } = require('zod')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')
const { logAction } = require('../utils/auditLog')
const { emitToWorkspace } = require('../socket/emitter')

const router = express.Router()

const createMilestoneSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().datetime().optional(),
})

const updateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  progress: z.number().min(0).max(100).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().datetime().optional(),
})

router.post('/:goalId/milestones', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { title, dueDate } = createMilestoneSchema.parse(req.body)
    const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId } })
    const milestone = await prisma.milestone.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        goalId: req.params.goalId,
      },
    })
    logAction(req.userId, goal.workspaceId, 'CREATE', 'Milestone', milestone.id)
    emitToWorkspace(goal.workspaceId, 'milestone:created', { milestone, goalId: req.params.goalId })
    res.status(201).json({ data: milestone, message: 'Milestone created' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:goalId/milestones/:id', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { title, progress, completed, dueDate } = updateMilestoneSchema.parse(req.body)
    const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId } })
    const milestone = await prisma.milestone.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(progress !== undefined && { progress }),
        ...(completed !== undefined && { completed }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    })
    logAction(req.userId, goal.workspaceId, 'UPDATE', 'Milestone', milestone.id)
    emitToWorkspace(goal.workspaceId, 'milestone:updated', { milestone, goalId: req.params.goalId })
    res.json({ data: milestone, message: 'Milestone updated' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:goalId/milestones/:id', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId } })
    await prisma.milestone.delete({ where: { id: req.params.id } })
    logAction(req.userId, goal.workspaceId, 'DELETE', 'Milestone', req.params.id)
    emitToWorkspace(goal.workspaceId, 'milestone:deleted', { milestoneId: req.params.id, goalId: req.params.goalId })
    res.json({ message: 'Milestone deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
