const express = require('express')
const { requirePermission } = require('../middleware/permissions')
const prisma = require('../prisma/client')

const router = express.Router()

router.get('/:workspaceId/audit', requirePermission('VIEW_AUDIT_LOG'), async (req, res) => {
  try {
    const { entityType, actorId, from, to, limit = 50, cursor } = req.query

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.userId,
          workspaceId: req.params.workspaceId,
        },
      },
    })

    const where = { workspaceId: req.params.workspaceId }

    // Role-based filtering: non-admins/moderators see only their own logs
    if (member && !['ADMIN', 'MODERATOR', 'PROJECT_MANAGER'].includes(member.role)) {
      where.actorId = req.userId
    } else if (actorId) {
      where.actorId = actorId
    }

    if (entityType) where.entityType = entityType
    if (from) where.createdAt = { gte: new Date(from) }
    if (to) {
      if (!where.createdAt) where.createdAt = {}
      where.createdAt.lte = new Date(to)
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit) || 50, 100),
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    })

    const nextCursor = logs.length === parseInt(limit) ? logs[logs.length - 1].id : null

    res.json({
      data: logs,
      nextCursor,
      message: 'Audit logs fetched',
      role: member?.role || 'MEMBER',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
