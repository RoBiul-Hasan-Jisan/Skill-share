const { can } = require('../lib/permissions')
const prisma = require('../prisma/client')

function requirePermission(permission) {
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

      req.memberRole = member.role

      if (!can(member.role, permission)) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      next()
    } catch (error) {
      return res.status(500).json({ error: 'Server error' })
    }
  }
}

module.exports = { requirePermission }
