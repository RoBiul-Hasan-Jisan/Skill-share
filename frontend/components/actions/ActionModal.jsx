'use client'

import { useState, useEffect } from 'react'
import { Modal, Input, Button } from '@/components/ui'
import { Avatar } from '@/components/ui'

export function ActionModal({
  isOpen,
  onClose,
  onSubmit,
  action = null,
  workspaceMembers = [],
  goalId = null,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    progress: 0,
    dueDate: '',
    assigneeId: null,
  })

  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title,
        description: action.description || '',
        status: action.status,
        priority: action.priority,
        progress: action.progress || 0,
        dueDate: action.dueDate ? action.dueDate.split('T')[0] : '',
        assigneeId: action.assigneeId,
      })
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        progress: 0,
        dueDate: '',
        assigneeId: null,
      })
    }
  }, [action, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={action ? 'Edit Action' : 'Create Action'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="What needs to be done?"
          required
        />

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add details..."
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary block mb-2">
            Progress: {formData.progress}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        <Input
          label="Due Date"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />

        <div>
          <label className="text-sm font-medium text-text-primary block mb-2">
            Assign To
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, assigneeId: null })}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                !formData.assigneeId
                  ? 'bg-accent text-white'
                  : 'hover:bg-surface-2'
              }`}
            >
              Unassigned
            </button>
            {workspaceMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setFormData({ ...formData, assigneeId: member.id })}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  formData.assigneeId === member.id
                    ? 'bg-accent text-white'
                    : 'hover:bg-surface-2'
                }`}
              >
                <Avatar
                  src={member.user?.avatarUrl}
                  name={member.user?.name}
                  size="xs"
                />
                <span className="text-sm">{member.user?.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant="primary" className="flex-1">
            {action ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
