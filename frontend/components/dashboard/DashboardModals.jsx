'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useNotificationStore } from '@/store/notificationStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { Modal, Button, Badge, Avatar, Input, ProgressBar } from '@/components/ui'
import { ChevronLeft, Trash2, Clock, Plus, Minus, Users, ListChecks } from 'lucide-react'
import toast from 'react-hot-toast'

// ============================================================================
// GOALS MODAL
// ============================================================================

export function DashboardGoalsModal({ workspaceId, isOpen, onClose, currentUser }) {
  const [view, setView] = useState('list')
  const [goals, setGoals] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', status: 'ON_TRACK', dueDate: '' })
  const [updating, setUpdating] = useState(false)
  const [progressUpdating, setProgressUpdating] = useState(false)

  useEffect(() => {
    if (isOpen && view === 'list') {
      if (workspaceId) {
        fetchGoals()
      } else {
        setLoading(false)
      }
    }
    setIsAdmin(currentUser?.role === 'ADMIN')
  }, [isOpen, view, currentUser, workspaceId])

  const fetchGoals = async () => {
    if (!workspaceId) return
    try {
      setLoading(true)
      const response = await api.get(`/workspaces/${workspaceId}/goals`)
      const activeGoals = response.data.data.filter((g) => g.status !== 'COMPLETED')
      setGoals(activeGoals)
    } catch (error) {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleViewGoal = (goal) => {
    setSelected(goal)
    setEditForm({
      title: goal.title || '',
      description: goal.description || '',
      status: goal.status || 'ON_TRACK',
      dueDate: goal.dueDate ? goal.dueDate.split('T')[0] : '',
    })
    setView('detail')
  }

  const handleUpdateGoal = async () => {
    if (!workspaceId) return
    if (!editForm.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      setUpdating(true)
      const dataToSend = {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
      }
      if (editForm.dueDate) {
        dataToSend.dueDate = new Date(editForm.dueDate).toISOString()
      }
      await api.patch(`/workspaces/${workspaceId}/goals/${selected.id}`, dataToSend)
      toast.success('Goal updated')
      setView('list')
      fetchGoals()
    } catch (error) {
      console.error('Update error:', error.response?.data || error)
      toast.error('Failed to update goal')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteGoal = async () => {
    if (!workspaceId) return
    if (!confirm('Delete this goal? This cannot be undone.')) return

    try {
      await api.delete(`/workspaces/${workspaceId}/goals/${selected.id}`)
      toast.success('Goal deleted')
      setView('list')
      fetchGoals()
    } catch (error) {
      toast.error('Failed to delete goal')
    }
  }

  const handleProgressChange = async (newProgress) => {
    if (!workspaceId) return
    try {
      setProgressUpdating(true)
      await api.patch(`/workspaces/${workspaceId}/goals/${selected.id}`, { progress: newProgress })
      setSelected({ ...selected, progress: newProgress })
      setGoals(goals.map(g => g.id === selected.id ? { ...g, progress: newProgress } : g))
      toast.success('Progress updated')
    } catch (error) {
      // Update locally even if API fails (demo mode)
      setSelected({ ...selected, progress: newProgress })
      setGoals(goals.map(g => g.id === selected.id ? { ...g, progress: newProgress } : g))
      toast.success('Progress updated (demo)')
    } finally {
      setProgressUpdating(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={view === 'list' ? 'Active Goals' : selected?.title}>
      <div className="max-w-lg">
        {view === 'list' ? (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-text-muted">Loading goals...</div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8 text-text-muted">No active goals</div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="p-4 bg-surface-2 rounded-xl hover:bg-surface transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary truncate">{goal.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={goal.status.toLowerCase().replace(/_/g, '-')} size="sm">
                          {goal.status.replace(/_/g, ' ')}
                        </Badge>
                        {goal.dueDate && (
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(goal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleViewGoal(goal)}>
                      View
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <ProgressBar value={goal.progress || 0} size="sm" />
                    <span className="text-xs font-semibold text-text-primary whitespace-nowrap">{goal.progress || 0}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-text-primary">{selected?.title}</h3>
                <Badge variant={selected?.status.toLowerCase().replace(/_/g, '-')} size="sm">
                  {selected?.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              {selected?.dueDate && (
                <div className="text-sm text-text-muted flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(selected.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>

            {selected?.description && (
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Description</p>
                <p className="text-text-secondary">{selected.description}</p>
              </div>
            )}

            {selected?.owner && (
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Owner</p>
                <div className="flex items-center gap-2">
                  <Avatar src={selected.owner.avatarUrl} name={selected.owner.name} size="sm" />
                  <span className="text-sm text-text-primary">{selected.owner.name}</span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-muted uppercase tracking-wider">Progress</p>
                <span className="text-xs text-text-muted">({selected?.actionItems?.filter(a => a.status === 'DONE').length || 0}/{selected?.actionItems?.length || 0} tasks)</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <ProgressBar value={selected?.progress || 0} size="sm" />
                <span className="text-sm font-semibold text-text-primary whitespace-nowrap">{selected?.progress || 0}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleProgressChange(Math.max(0, (selected?.progress || 0) - 10))}
                  disabled={progressUpdating}
                  className="p-1.5 rounded hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary disabled:opacity-50"
                  title="Decrease 10%"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => handleProgressChange(Math.min(100, (selected?.progress || 0) + 10))}
                  disabled={progressUpdating}
                  className="p-1.5 rounded hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary disabled:opacity-50"
                  title="Increase 10%"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selected?.milestones?.length > 0 && (
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Milestones ({selected.milestones.length})</p>
                <div className="space-y-2">
                  {selected.milestones.map((milestone) => (
                    <div key={milestone.id} className="p-2 bg-surface-2 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-primary font-medium">{milestone.title}</span>
                        <span className="text-xs text-text-muted">{milestone.progress}%</span>
                      </div>
                      <ProgressBar value={milestone.progress} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected?.actionItems?.length > 0 && (
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Related Actions ({selected.actionItems.length})</p>
                <div className="space-y-2">
                  {selected.actionItems.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-2 bg-surface-2 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{action.title}</div>
                        <Badge variant={action.status.toLowerCase().replace(/_/g, '-')} size="sm" className="mt-0.5">
                          {action.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Admin Actions</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Title</label>
                    <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Goal title" />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Goal description"
                      className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none text-sm"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent text-sm"
                    >
                      <option value="ON_TRACK">On Track</option>
                      <option value="AT_RISK">At Risk</option>
                      <option value="BEHIND">Behind</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Due Date</label>
                    <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleUpdateGoal} disabled={updating} className="flex-1">
                      {updating ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="danger" onClick={handleDeleteGoal} disabled={updating} size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ============================================================================
// MEMBERS MODAL
// ============================================================================

export function DashboardMembersModal({ workspaceId, isOpen, onClose, currentUser }) {
  const [view, setView] = useState('list')
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(() => {
    if (isOpen && view === 'list') {
      if (workspaceId) {
        fetchMembers()
      } else {
        setLoading(false)
      }
    }
    setIsAdmin(currentUser?.role === 'ADMIN')
  }, [isOpen, view, currentUser, workspaceId])

  const fetchMembers = async () => {
    if (!workspaceId) return
    try {
      setLoading(true)
      const response = await api.get(`/workspaces/${workspaceId}/members`)
      setMembers(response.data.data)
    } catch (error) {
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleViewMember = (member) => {
    setSelected(member)
    setSelectedRole(member.role)
    setView('detail')
  }

  const handleUpdateRole = async () => {
    if (!workspaceId) return
    try {
      setUpdating(true)
      await api.patch(`/workspaces/${workspaceId}/members/${selected.userId}`, { role: selectedRole })
      toast.success('Role updated')
      setView('list')
      fetchMembers()
    } catch (error) {
      toast.error('Failed to update role')
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleActive = async () => {
    if (!workspaceId) return
    try {
      setUpdating(true)
      await api.patch(`/workspaces/${workspaceId}/members/${selected.userId}/status`, { isActive: !selected.isActive })
      toast.success(selected.isActive ? 'Member deactivated' : 'Member activated')
      setView('list')
      fetchMembers()
    } catch (error) {
      toast.error('Failed to update member status')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!workspaceId) return
    if (!confirm('Remove this member from the workspace? This cannot be undone.')) return

    try {
      await api.delete(`/workspaces/${workspaceId}/members/${selected.userId}`)
      toast.success('Member removed')
      setView('list')
      fetchMembers()
    } catch (error) {
      toast.error('Failed to remove member')
    }
  }

  const isSelf = selected?.userId === currentUser?.id

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={view === 'list' ? 'Team Members' : selected?.user?.name}>
      <div className="max-w-lg">
        {view === 'list' ? (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-text-muted">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-text-muted">No members</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-surface-2 rounded-xl hover:bg-surface transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar src={member.user?.avatarUrl} name={member.user?.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary truncate">{member.user?.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={member.role.toLowerCase()}>{member.role}</Badge>
                        <span className="text-xs text-text-muted">{member.user?.email}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleViewMember(member)}>
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              <Avatar src={selected?.user?.avatarUrl} name={selected?.user?.name} size="lg" />
              <div>
                <h3 className="text-lg font-bold text-text-primary">{selected?.user?.name}</h3>
                <p className="text-sm text-text-muted">{selected?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={selected?.role.toLowerCase()}>{selected?.role}</Badge>
              <Badge variant={selected?.isActive ? 'success' : 'default'}>{selected?.isActive ? 'Active' : 'Inactive'}</Badge>
              {selected?.joinedAt && (
                <span className="text-xs text-text-muted">
                  Joined {new Date(selected.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            {isAdmin && !isSelf && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Admin Actions</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Role</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent text-sm"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="PROJECT_MANAGER">Project Manager</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="MEMBER">Member</option>
                      </select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleUpdateRole}
                      disabled={updating || selectedRole === selected?.role}
                      className="flex-1"
                    >
                      {updating ? 'Updating...' : 'Update Role'}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={selected?.isActive ? 'secondary' : 'primary'}
                      onClick={handleToggleActive}
                      disabled={updating}
                      className="flex-1"
                    >
                      {updating ? 'Updating...' : selected?.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="danger" onClick={handleRemoveMember} disabled={updating}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ============================================================================
// NOTIFICATIONS MODAL
// ============================================================================

export function DashboardNotificationsModal({ isOpen, onClose }) {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const { notifications, markRead, removeNotification } = useNotificationStore()

  const notificationIcons = {
    MENTION: '🎯',
    INVITE: '📧',
    GOAL_UPDATE: '📈',
    ANNOUNCEMENT: '📢',
    default: '🔔',
  }

  const handleViewNotification = (notif) => {
    setSelected(notif)
    if (!notif.read) {
      markRead(notif.id)
    }
    setView('detail')
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={view === 'list' ? 'Notifications' : 'Notification Details'}>
      <div className="max-w-lg">
        {view === 'list' ? (
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-text-muted">No notifications</div>
            ) : (
              <>
                {unreadCount > 0 && (
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{unreadCount} unread</p>
                )}
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start justify-between p-3 rounded-lg transition-colors cursor-pointer border-l-2 ${
                        notif.read ? 'bg-surface-2 border-transparent hover:bg-surface' : 'bg-accent/5 border-accent'
                      }`}
                      onClick={() => handleViewNotification(notif)}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0 mt-0.5">{notificationIcons[notif.type] || notificationIcons.default}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${notif.read ? 'text-text-secondary' : 'text-text-primary'}`}>{notif.message}</div>
                          <div className="text-xs text-text-muted mt-1">
                            {notif.createdAt
                              ? new Date(notif.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'now'}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewNotification(notif); }}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div>
              <div className="text-2xl mb-2">{notificationIcons[selected?.type] || notificationIcons.default}</div>
              <p className="text-text-primary">{selected?.message}</p>
              {selected?.createdAt && (
                <p className="text-xs text-text-muted mt-2">
                  {new Date(selected.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            <div className="border-t border-border pt-4 mt-4 flex gap-2">
              {!selected?.read && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    markRead(selected.id)
                    setView('list')
                  }}
                  className="flex-1"
                >
                  Mark as read
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  removeNotification(selected.id)
                  setView('list')
                }}
                className="flex-1"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ============================================================================
// WORKSPACES MODAL
// ============================================================================

export function DashboardWorkspacesModal({ isOpen, onClose, currentUser }) {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'ACTIVE', deadline: '' })
  const [updating, setUpdating] = useState(false)
  const { workspaces } = useWorkspaceStore()

  useEffect(() => {
    setIsAdmin(currentUser?.role === 'ADMIN')
    if (view === 'detail' && selected) {
      setEditForm({
        name: selected.name || '',
        description: selected.description || '',
        status: selected.status || 'ACTIVE',
        deadline: selected.deadline ? selected.deadline.split('T')[0] : '',
      })
    }
  }, [selected, view, currentUser])

  const handleViewWorkspace = (workspace) => {
    setSelected(workspace)
    setView('detail')
  }

  const handleUpdateWorkspace = async () => {
    if (!editForm.name.trim()) {
      toast.error('Workspace name is required')
      return
    }

    try {
      setUpdating(true)
      await api.patch(`/workspaces/${selected.id}`, {
        name: editForm.name,
        description: editForm.description,
        status: editForm.status,
        ...(editForm.deadline ? { deadline: new Date(editForm.deadline).toISOString() } : {}),
      })
      toast.success('Workspace updated')
      setView('list')
    } catch (error) {
      toast.error('Failed to update workspace')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={view === 'list' ? 'Workspaces' : selected?.name}>
      <div className="max-w-lg">
        {view === 'list' ? (
          <div className="space-y-3">
            {workspaces.length === 0 ? (
              <div className="text-center py-8 text-text-muted">No workspaces</div>
            ) : (
              workspaces.map((ws) => {
                const daysLeft = ws.deadline
                  ? Math.ceil((new Date(ws.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                  : null
                const taskTotal = ws.taskCounts
                  ? Object.values(ws.taskCounts).reduce((a, b) => a + b, 0)
                  : 0
                return (
                  <div key={ws.id} className="flex items-center justify-between p-4 bg-surface-2 rounded-xl hover:bg-surface transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ws.accentColor || '#6366F1' }}
                        />
                        <div className="font-medium text-text-primary truncate">{ws.name}</div>
                        <Badge
                          variant={ws.status === 'COMPLETED' ? 'completed' : 'default'}
                          size="sm"
                        >
                          {ws.status === 'ACTIVE' ? 'Active' : ws.status === 'ON_HOLD' ? 'On Hold' : 'Completed'}
                        </Badge>
                      </div>
                      {ws.description && (
                        <p className="text-sm text-text-muted truncate mt-1">{ws.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {ws._count?.members || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3 h-3" />
                          {taskTotal}
                        </span>
                        {daysLeft !== null && (
                          <span className={`flex items-center gap-1 ${daysLeft <= 0 ? 'text-red-400' : ''}`}>
                            <Clock className="w-3 h-3" />
                            {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleViewWorkspace(ws)}>
                      View
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-text-primary">{selected?.name}</h3>
                <Badge
                  variant={selected?.status === 'COMPLETED' ? 'completed' : 'default'}
                  size="sm"
                >
                  {selected?.status === 'ACTIVE' ? 'Active' : selected?.status === 'ON_HOLD' ? 'On Hold' : 'Completed'}
                </Badge>
              </div>
              {selected?.description && (
                <p className="text-text-secondary mt-1">{selected.description}</p>
              )}
              {selected?.deadline && (
                <div className="flex items-center gap-1 text-sm text-text-muted mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  Due {new Date(selected.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {(() => {
                    const days = Math.ceil((new Date(selected.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                    if (days <= 0) return <span className="text-red-400 ml-1">(Overdue)</span>
                    if (days <= 3) return <span className="text-amber-400 ml-1">({days}d left)</span>
                    return <span className="ml-1">({days}d left)</span>
                  })()}
                </div>
              )}
              {selected?.createdAt && (
                <p className="text-xs text-text-muted mt-2">
                  Created {new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>

            {isAdmin && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Admin Actions</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Workspace Name</label>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Workspace name" />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Workspace description"
                      className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none text-sm"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent text-sm"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Deadline</label>
                    <Input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} />
                  </div>

                  <Button variant="primary" onClick={handleUpdateWorkspace} disabled={updating} className="w-full">
                    {updating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
