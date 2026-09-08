const express = require('express')
const { z } = require('zod')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')
const { requirePermission } = require('../middleware/permissions')
const { getVisibilityFilter } = require('../middleware/visibility')
const { logAction } = require('../utils/auditLog')
const { emitToWorkspace, emitToUser } = require('../socket/emitter')
const { sendMentionEmail } = require('../services/emailService')
const { sendSlackMessage, createAnnouncementBlock } = require('../services/slackService')

const router = express.Router()

const createAnnounceSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})

const updateAnnounceSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
})

router.get('/:workspaceId/announcements', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { cursor } = req.query
    const visFilter = getVisibilityFilter(req, 'announcement')
    const announcements = await prisma.announcement.findMany({
      where: { workspaceId: req.params.workspaceId, deletedAt: null, ...visFilter },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
        _count: { select: { comments: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    const nextCursor = announcements.length >= 50 ? announcements[49].id : null

    res.json({ data: announcements.slice(0, 50), nextCursor, message: 'Announcements fetched' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:workspaceId/announcements', requirePermission('CREATE_ANNOUNCEMENT'), async (req, res) => {
  try {
    const { title, content } = createAnnounceSchema.parse(req.body)
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: req.userId,
        workspaceId: req.params.workspaceId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        comments: { include: { author: { select: { id: true, name: true, avatarUrl: true } } } },
        reactions: true,
        _count: { select: { comments: true } },
      },
    })

    // Send Slack notification
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.workspaceId },
      select: { name: true, slackWebhookUrl: true },
    })

    if (workspace?.slackWebhookUrl) {
      const block = createAnnouncementBlock(announcement, workspace.name)
      await sendSlackMessage(workspace.slackWebhookUrl, block)
    }

    logAction(req.userId, req.params.workspaceId, 'CREATE', 'Announcement', announcement.id)
    emitToWorkspace(req.params.workspaceId, 'announcement:new', { announcement })
    res.status(201).json({ data: announcement, message: 'Announcement created' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:workspaceId/announcements/:annId', requireRole('ADMIN'), async (req, res) => {
  try {
    const { title, content } = updateAnnounceSchema.parse(req.body)
    const announcement = await prisma.announcement.update({
      where: { id: req.params.annId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
      },
      include: { comments: true, reactions: true },
    })
    logAction(req.userId, req.params.workspaceId, 'UPDATE', 'Announcement', req.params.annId)
    emitToWorkspace(req.params.workspaceId, 'announcement:updated', { announcement })
    res.json({ data: announcement, message: 'Announcement updated' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:workspaceId/announcements/:annId', requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.announcement.update({
      where: { id: req.params.annId },
      data: { deletedAt: new Date() }
    })
    logAction(req.userId, req.params.workspaceId, 'DELETE', 'Announcement', req.params.annId)
    emitToWorkspace(req.params.workspaceId, 'announcement:deleted', { announcementId: req.params.annId })
    res.json({ message: 'Announcement deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:workspaceId/announcements/:annId/restore', requireRole('ADMIN'), async (req, res) => {
  try {
    const announcement = await prisma.announcement.update({
      where: { id: req.params.annId },
      data: { deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reactions: true,
      },
    })
    logAction(req.userId, req.params.workspaceId, 'RESTORE', 'Announcement', req.params.annId)
    emitToWorkspace(req.params.workspaceId, 'announcement:restored', { announcement })
    res.json({ data: announcement, message: 'Announcement restored' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:workspaceId/announcements/:annId/pin', requirePermission('PIN_ANNOUNCEMENT'), async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.annId } })
    const updated = await prisma.announcement.update({
      where: { id: req.params.annId },
      data: { isPinned: !announcement.isPinned },
    })
    logAction(req.userId, req.params.workspaceId, 'UPDATE', 'Announcement', req.params.annId, { pinned: updated.isPinned })
    emitToWorkspace(req.params.workspaceId, 'announcement:pinned', { announcementId: req.params.annId, isPinned: updated.isPinned })
    res.json({ data: updated, message: 'Announcement pinned status updated' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:workspaceId/announcements/:annId/reactions', requirePermission('REACT_ANNOUNCEMENT'), async (req, res) => {
  try {
    const { emoji } = z.object({ emoji: z.string().min(1).max(10) }).parse(req.body)
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_announcementId_emoji: {
          userId: req.userId,
          announcementId: req.params.annId,
          emoji,
        },
      },
    })

    let reaction
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      logAction(req.userId, req.params.workspaceId, 'DELETE', 'Reaction', existing.id)
      emitToWorkspace(req.params.workspaceId, 'reaction:toggled', { announcementId: req.params.annId, emoji, userId: req.userId, removed: true })
    } else {
      reaction = await prisma.reaction.create({
        data: { emoji, userId: req.userId, announcementId: req.params.annId },
      })
      logAction(req.userId, req.params.workspaceId, 'CREATE', 'Reaction', reaction.id)
      emitToWorkspace(req.params.workspaceId, 'reaction:toggled', { announcementId: req.params.annId, emoji, userId: req.userId, removed: false })
    }

    res.json({ message: 'Reaction toggled' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:workspaceId/announcements/:annId/comments', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { announcementId: req.params.annId },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ data: comments, message: 'Comments fetched' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:workspaceId/announcements/:annId/comments', requirePermission('COMMENT_ANNOUNCEMENT'), async (req, res) => {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body)

    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex) || []
    const mentionedUsers = []

    for (const mention of mentions) {
      const username = mention.slice(1)
      const user = await prisma.user.findFirst({
        where: { name: { contains: username, mode: 'insensitive' } },
      })
      if (user) {
        mentionedUsers.push(user)
      }
    }

    const { comment, notifications } = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: req.userId,
          announcementId: req.params.annId,
        },
        include: { author: { select: { id: true, name: true, avatarUrl: true, email: true } } },
      })

      const createdNotifications = []
      for (const user of mentionedUsers) {
        await tx.mention.create({
          data: { userId: user.id, commentId: newComment.id },
        })
        const notification = await tx.notification.create({
          data: {
            type: 'MENTION',
            message: `${newComment.author.name} mentioned you`,
            userId: user.id,
          },
        })
        createdNotifications.push({ notification, user })
      }

      return { comment: newComment, notifications: createdNotifications }
    })

    for (const { notification, user } of notifications) {
      emitToUser(user.id, 'notification:new', { notification })
      await sendMentionEmail(user.email, comment.author.name, '', content.substring(0, 200), '#')
    }

    logAction(req.userId, req.params.workspaceId, 'CREATE', 'Comment', comment.id)
    emitToWorkspace(req.params.workspaceId, 'comment:new', { comment, announcementId: req.params.annId })
    res.status(201).json({ data: comment, message: 'Comment posted' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' })
    }
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:workspaceId/announcements/:annId/comments/:commentId', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } })
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }
    if (comment.authorId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    await prisma.comment.delete({ where: { id: req.params.commentId } })
    logAction(req.userId, req.params.workspaceId, 'DELETE', 'Comment', req.params.commentId)
    emitToWorkspace(req.params.workspaceId, 'comment:deleted', { commentId: req.params.commentId, announcementId: req.params.annId })
    res.json({ message: 'Comment deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:workspaceId/announcements/:annId/reactions/:emoji', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    await prisma.reaction.deleteMany({
      where: {
        announcementId: req.params.annId,
        emoji: req.params.emoji,
        userId: req.userId,
      },
    })
    logAction(req.userId, req.params.workspaceId, 'DELETE', 'Reaction', 'batch')
    emitToWorkspace(req.params.workspaceId, 'reaction:removed', { announcementId: req.params.annId, emoji: req.params.emoji, userId: req.userId })
    res.json({ message: 'Reaction removed' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:workspaceId/announcements/:annId/unpin', requirePermission('PIN_ANNOUNCEMENT'), async (req, res) => {
  try {
    const announcement = await prisma.announcement.update({
      where: { id: req.params.annId },
      data: { isPinned: false },
    })
    logAction(req.userId, req.params.workspaceId, 'UPDATE', 'Announcement', req.params.annId, { pinned: false })
    emitToWorkspace(req.params.workspaceId, 'announcement:unpinned', { announcementId: req.params.annId })
    res.json({ data: announcement, message: 'Announcement unpinned' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
