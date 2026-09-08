const prisma = require('../prisma/client')

async function logAction(actorId, workspaceId, action, entityType, entityId, metadata = null) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        metadata,
        actorId,
        workspaceId,
      },
    })
  } catch (error) {
    console.error('Error logging action:', error)
  }
}

module.exports = { logAction }
