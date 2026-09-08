const express = require('express')
const { z } = require('zod')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')

const router = express.Router({ mergeParams: true })

const searchSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
})

router.get('/:workspaceId/search', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { q } = searchSchema.parse(req.query)
    const { workspaceId } = req.params

    const searchResults = await prisma.$transaction([
      prisma.goal.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, status: true, dueDate: true },
      }),
      prisma.actionItem.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, status: true, priority: true },
      }),
      prisma.announcement.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true, createdAt: true },
      }),
      prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        take: 5,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
    ])

    const members = searchResults[3].map(m => ({
      ...m,
      user: req.memberRole === 'ADMIN'
        ? m.user
        : { id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl },
    }))

    res.json({
      data: {
        goals: searchResults[0],
        actions: searchResults[1],
        announcements: searchResults[2],
        members,
      },
      message: 'Search results',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid search query', details: error.errors })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
