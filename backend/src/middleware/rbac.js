const prisma = require('../prisma/client')

function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.id || req.params.workspaceId

      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID required' })
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.userId,
            workspaceId,
          },
        },
      })

      if (!member) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      req.memberRole = member.role
      next()
    } catch (error) {
      return res.status(500).json({ error: 'Server error' })
    }
  }
}

module.exports = { requireRole }
