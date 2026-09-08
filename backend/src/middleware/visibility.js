function getVisibilityFilter(req, entityType) {
  if (req.memberRole === 'ADMIN' || req.memberRole === 'MODERATOR') return {}

  if (entityType === 'announcement') return {}
  if (entityType === 'goal') return { ownerId: req.userId }
  if (entityType === 'action') return { assigneeId: req.userId }

  return {}
}

module.exports = { getVisibilityFilter }
