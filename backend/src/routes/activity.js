const express = require('express')
const prisma = require('../prisma/client')
const { requireRole } = require('../middleware/rbac')

const router = express.Router({ mergeParams: true })

router.get('/:workspaceId/activity', requireRole('ADMIN', 'MODERATOR', 'MEMBER'), async (req, res) => {
  try {
    const { workspaceId } = req.params
    const { cursor } = req.query

    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      include: {
        actor: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    const nextCursor = logs.length >= 20 ? logs[19].id : null

    res.json({
      data: logs.slice(0, 20),
      nextCursor,
      message: 'Activity fetched',
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
