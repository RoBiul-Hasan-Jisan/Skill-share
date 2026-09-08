'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGoalStore } from '@/store/goalStore'
import { useUIStore } from '@/store/uiStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Button, Badge, EmptyState, SkeletonCard, Modal, Input } from '@/components/ui'
import { GoalCard } from '@/components/goals/GoalCard'
import { EntityCommentThread } from '@/components/comments/EntityCommentThread'
import { Target, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
const statusFilters = ['All', 'ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']

export default function GoalsPage() {
  const { id: workspaceId } = useParams()
  const { goals, setGoals, addGoal, removeGoal, updateGoal } = useGoalStore()
  const { members } = useWorkspaceStore()
  const { user } = useAuthStore()
  const { openModal, closeModal, activeModal } = useUIStore()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', progress: 0, assigneeId: null, recurrenceRule: null })
  const [editingGoal, setEditingGoal] = useState(null)
  const [commentTarget, setCommentTarget] = useState(null)

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await api.get(`/workspaces/${workspaceId}/goals`)
        setGoals(response.data.data)
      } catch (error) {
        console.error('Failed to fetch goals:', error)
      } finally {
        setLoading(false)
      }
    }

    if (workspaceId) {
      fetchGoals()
    }
  }, [workspaceId, setGoals])

  const filtered = goals.filter((g) =>
    filter === 'All' ? true : g.status === filter
  )

  const handleEditGoal = (goal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description || '',
      dueDate: goal.dueDate ? goal.dueDate.split('T')[0] : '',
      progress: goal.progress || 0,
      assigneeId: goal.assignee?.id || null,
      recurrenceRule: goal.recurrenceRule || null,
    })
    openModal('create-goal')
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Please enter a goal title')
      return
    }

    if (editingGoal) {
      // Update existing goal
      try {
        await api.patch(`/workspaces/${workspaceId}/goals/${editingGoal.id}`, formData)
        updateGoal(editingGoal.id, {
          ...editingGoal,
          ...formData,
        })
        toast.success('Goal updated')
      } catch (error) {
        toast.error('Failed to update goal')
      }
    } else {
      // Create new goal
      try {
        const response = await api.post(`/workspaces/${workspaceId}/goals`, { ...formData, ownerId: formData.assigneeId })
        addGoal(response.data.data)
        toast.success('Goal created')
      } catch (error) {
        toast.error('Failed to create goal')
      }
    }

    closeModal()
    setFormData({ title: '', description: '', dueDate: '', progress: 0, assigneeId: null })
    setEditingGoal(null)
  }

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Delete this goal?')) return
    try {
      await api.delete(`/workspaces/${workspaceId}/goals/${goalId}`)
      removeGoal(goalId)
      toast.success('Goal deleted')
    } catch (error) {
      toast.error('Failed to delete goal')
    }
  }

  const handleCommentClick = (goal) => {
    setCommentTarget(goal)
    openModal('entity-comment-goal')
  }

  const handleProgressChange = async (goalId, newProgress) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const originalGoal = { ...goal }
    updateGoal(goalId, { ...goal, progress: newProgress })

    try {
      await api.patch(`/workspaces/${workspaceId}/goals/${goalId}`, {
        progress: newProgress,
      })
    } catch (error) {
      updateGoal(goalId, originalGoal)
      toast.error('Failed to update progress')
    }
  }

  const handleAssignGoal = async (goalId, memberId) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    const assignee = members?.find((m) => m.id === memberId)
    const originalGoal = { ...goal }
    updateGoal(goalId, { ...goal, assignee })

    try {
      await api.patch(`/workspaces/${workspaceId}/goals/${goalId}`, {
        assigneeId: memberId,
      })
      toast.success(`Goal assigned to ${assignee?.user?.name}`)
    } catch (error) {
      updateGoal(goalId, originalGoal)
      toast.error('Failed to assign goal')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
            Goals
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-2">Track team objectives and milestones</p>
        </div>
        <Button
          variant="primary"
          onClick={() => openModal('create-goal')}
          className="gap-2 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-text-primary hover:bg-surface'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create your first goal to get started"
          action={() => openModal('create-goal')}
          actionLabel="Create Goal"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onEdit={handleEditGoal}
              onClick={() => handleEditGoal(goal)}
              onCommentClick={handleCommentClick}
              onProgressChange={handleProgressChange}
              onAssign={handleAssignGoal}
              workspaceMembers={members}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={activeModal === 'create-goal'}
        onClose={() => {
          closeModal()
          setFormData({ title: '', description: '', dueDate: '', progress: 0 })
          setEditingGoal(null)
        }}
        title={editingGoal ? 'Edit Goal' : 'Create Goal'}
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Launch v2.0"
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What needs to be accomplished?"
          />
          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <div>
            <label className="text-xs text-text-muted mb-2 block font-semibold">Recurrence</label>
            <select
              value={formData.recurrenceRule || ''}
              onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value || null })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary outline-none focus:border-accent transition-colors"
            >
              <option value="">No recurrence</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-2 block font-semibold">Assign to</label>
            <select
              value={formData.assigneeId || ''}
              onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value || null })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary outline-none focus:border-accent transition-colors"
            >
              <option value="">No one</option>
              {members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user?.name || member.name || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-2 block font-semibold">Progress: {formData.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" className="flex-1">
              {editingGoal ? 'Save Changes' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                closeModal()
                setFormData({ title: '', description: '', dueDate: '', progress: 0 })
                setEditingGoal(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === 'entity-comment-goal'}
        onClose={() => {
          closeModal()
          setCommentTarget(null)
        }}
        title="Comments"
      >
        {commentTarget && (
          <EntityCommentThread
            workspaceId={workspaceId}
            entityType="goal"
            entityId={commentTarget.id}
            currentUserId={user?.id}
            workspaceMembers={members}
          />
        )}
      </Modal>
    </div>
  )
}
