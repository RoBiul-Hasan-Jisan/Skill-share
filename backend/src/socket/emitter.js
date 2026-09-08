let io

function initEmitter(_io) {
  io = _io
}

function emitToWorkspace(workspaceId, event, data) {
  if (!io) return
  io.to(`workspace:${workspaceId}`).emit(event, {
    ...data,
    timestamp: new Date(),
  })
}

function emitToUser(userId, event, data) {
  if (!io) return
  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date(),
  })
}

module.exports = {
  initEmitter,
  emitToWorkspace,
  emitToUser,
}
