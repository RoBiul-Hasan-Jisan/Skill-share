const express = require('express')
const { z } = require('zod')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')
const { logAction } = require('../utils/auditLog')
const { emitToWorkspace } = require('../socket/emitter')

const router = express.Router({ mergeParams: true })

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
})

router.get('/actions/:actionId/comments', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { actionId } = req.params

    const comments = await prisma.comment.findMany({
      where: { actionItemId: actionId },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ data: comments, message: 'Comments fetched' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/actions/:actionId/comments', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { workspaceId, actionId } = req.params
    const { content } = commentSchema.parse(req.body)

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: req.userId,
        actionItemId: actionId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    })

    logAction(req.userId, workspaceId, 'CREATE', 'Comment', comment.id)
    emitToWorkspace(workspaceId, 'comment:new', { comment, actionItemId: actionId })

    res.status(201).json({ data: comment, message: 'Comment created' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/actions/:actionId/comments/:commentId', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { workspaceId, commentId } = req.params

    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (comment.authorId !== req.userId && req.memberRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.comment.delete({ where: { id: commentId } })

    logAction(req.userId, workspaceId, 'DELETE', 'Comment', commentId)
    emitToWorkspace(workspaceId, 'comment:deleted', { commentId })

    res.json({ message: 'Comment deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/goals/:goalId/comments', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { goalId } = req.params

    const comments = await prisma.comment.findMany({
      where: { goalId: goalId },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ data: comments, message: 'Comments fetched' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/goals/:goalId/comments', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { workspaceId, goalId } = req.params
    const { content } = commentSchema.parse(req.body)

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: req.userId,
        goalId: goalId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    })

    logAction(req.userId, workspaceId, 'CREATE', 'Comment', comment.id)
    emitToWorkspace(workspaceId, 'comment:new', { comment, goalId: goalId })

    res.status(201).json({ data: comment, message: 'Comment created' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/goals/:goalId/comments/:commentId', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { workspaceId, commentId } = req.params

    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (comment.authorId !== req.userId && req.memberRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await prisma.comment.delete({ where: { id: commentId } })

    logAction(req.userId, workspaceId, 'DELETE', 'Comment', commentId)
    emitToWorkspace(workspaceId, 'comment:deleted', { commentId })

    res.json({ message: 'Comment deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
