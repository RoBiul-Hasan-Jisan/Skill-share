'use client'

import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useWorkspaceStore } from '@/store/workspaceStore'

const ACCENT_COLORS = [
  { name: 'EMBER', value: '#D34F1F' },
  { name: 'OCHRE', value: '#D97706' },
  { name: 'SAGE', value: '#559B37' },
  { name: 'SLATE', value: '#475569' },
  { name: 'PLUM', value: '#7C3AED' },
  { name: 'INDIGO', value: '#4F46E5' },
  { name: 'MOSS', value: '#15803D' },
  { name: 'RUST', value: '#8B4513' },
]

export function CreateWorkspaceModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    deadline: '',
    accentColor: '#D34F1F',
  })
  const [loading, setLoading] = useState(false)
  const { setActiveWorkspace, setWorkspaces, workspaces } = useWorkspaceStore()

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Workspace name is required')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/workspaces', {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        deadline: formData.deadline || undefined,
        accentColor: formData.accentColor,
      })

      const newWorkspace = response.data.data
      setWorkspaces([...workspaces, newWorkspace])
      setActiveWorkspace(newWorkspace)

      toast.success('Workspace created!')
      setFormData({ name: '', description: '', status: 'ACTIVE', deadline: '', accentColor: '#D34F1F' })
      onClose()
    } catch (error) {
      console.error('Create error:', error)
      toast.error(error.response?.data?.error || 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  const selectedColor = ACCENT_COLORS.find((c) => c.value === formData.accentColor)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-text-primary mb-2">
            Open a fresh workspace.
          </h2>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* 01 NAME */}
          <div>
            <label className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 block">
              01 NAME
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Engineering, Marketing, Q3 Launch"
              className="w-full px-0 py-2 border-b-2 border-border bg-transparent text-text-primary placeholder-text-muted outline-none transition-colors hover:border-text-secondary focus:border-accent text-sm"
            />
            <p className="text-xs text-text-muted mt-3">Up to 50 characters.</p>
          </div>

          {/* 02 DESCRIPTION */}
          <div>
            <label className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 block">
              02 DESCRIPTION
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional. A short note on what this workspace is for."
              className="w-full px-0 py-2 border-b-2 border-border bg-transparent text-text-primary placeholder-text-muted outline-none transition-colors hover:border-text-secondary focus:border-accent text-sm resize-none"
              rows="3"
            />
            <p className="text-xs text-text-muted mt-3">Up to 500 characters. Visible to every member.</p>
          </div>

          {/* 03 STATUS */}
          <div>
            <label className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 block">
              03 STATUS
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-0 py-2 border-b-2 border-border bg-transparent text-text-primary outline-none transition-colors hover:border-text-secondary focus:border-accent text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* 04 DEADLINE */}
          <div>
            <label className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 block">
              04 DEADLINE
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-0 py-2 border-b-2 border-border bg-transparent text-text-primary outline-none transition-colors hover:border-text-secondary focus:border-accent text-sm"
            />
            <p className="text-xs text-text-muted mt-3">Optional project deadline date.</p>
          </div>

          {/* 05 ACCENT */}
          <div>
            <label className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 block">
              03 ACCENT · {formData.accentColor.toUpperCase()}
            </label>
            <div className="border border-border rounded-lg p-4">
              <div className="grid grid-cols-8 gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormData({ ...formData, accentColor: color.value })}
                    className={`w-full aspect-square rounded-lg transition-all ${
                      formData.accentColor === color.value ? 'ring-2 ring-offset-2 ring-text-primary' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {formData.accentColor === color.value && (
                      <span className="text-white text-xl">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-3 mt-3">
                {ACCENT_COLORS.map((color) => (
                  <p key={color.value} className="text-xs text-text-muted uppercase text-center font-medium">
                    {color.name}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* 06 PREVIEW */}
          <div>
            <label className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 block">
              04 PREVIEW
            </label>
            <div className="border-l-4 p-4 bg-surface" style={{ borderLeftColor: formData.accentColor }}>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                {formData.name || 'Untitled'}
              </h3>
              <p className="text-text-secondary text-sm">
                {formData.description || 'Untitled workspace — add a description to set the tone.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            CANCEL
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'CREATING...' : 'CREATE WORKSPACE →'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
