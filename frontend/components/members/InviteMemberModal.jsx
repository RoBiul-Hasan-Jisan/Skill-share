'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Mail, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { Button } from '@/components/ui'

const ROLES = [
  { value: 'ADMIN', label: 'Admin', description: 'Full control of workspace' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager', description: 'Can manage projects, goals, and deadlines' },
  { value: 'MODERATOR', label: 'Moderator', description: 'Can manage goals and announcements' },
  { value: 'MEMBER', label: 'Member', description: 'Can create and update own items' },
]

export default function InviteMemberModal({ workspaceId, onClose, onSuccess }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [loading, setLoading] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [joinLink, setJoinLink] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }

    setLoading(true)
    try {
      const response = await api.post(`/workspaces/${workspaceId}/invite`, {
        email: email.trim(),
        role,
      })

      // Generate a join link that can be shared
      const inviteLink = `${window.location.origin}/join?workspaceId=${workspaceId}&email=${encodeURIComponent(email.trim())}&token=${response.data.token || 'invite'}`

      setSentEmail(email)
      setJoinLink(inviteLink)
      setInviteSent(true)
      toast.success('Invitation sent successfully!')

      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess({ email: email.trim(), role })
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send invitation'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinLink)
    toast.success('Link copied to clipboard!')
  }

  const copyEmail = () => {
    navigator.clipboard.writeText(sentEmail)
    toast.success('Email copied to clipboard!')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-border rounded-xl max-w-md w-full max-h-[calc(100vh-3rem)] overflow-y-auto p-6 shadow-2xl z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            {inviteSent ? 'Invitation Sent!' : 'Invite Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {inviteSent ? (
          // Success Screen
          <div className="space-y-6">
            <div className="p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-accent font-medium">✓ Invitation email sent to:</p>
              <p className="text-text-primary font-semibold mt-1">{sentEmail}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">Share this link with them:</h3>
              <div className="p-3 bg-surface-2 rounded-lg border border-border flex items-center gap-2">
                <input
                  type="text"
                  value={joinLink}
                  readOnly
                  className="flex-1 bg-transparent text-text-primary text-sm outline-none truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 text-xs bg-accent text-white rounded hover:opacity-90 transition-opacity font-medium whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-text-primary mb-3">They can join by:</h3>
              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex gap-2">
                  <span className="font-medium text-accent flex-shrink-0">•</span>
                  <span>Clicking the link in their email</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-accent flex-shrink-0">•</span>
                  <span>Using the share link above</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setInviteSent(false)
                  setEmail('')
                  setRole('MEMBER')
                }}
                className="flex-1"
              >
                Invite Another
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onClose}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
          {/* Invite Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@company.com"
                className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Assign Role
            </label>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-surface-2 transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-text-primary">{r.label}</div>
                    <div className="text-sm text-text-muted">{r.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>

        {/* How It Works */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-3">How it works</h3>
          <div className="space-y-2 text-xs text-text-muted">
            <div className="flex gap-2">
              <span className="font-medium text-accent flex-shrink-0">1.</span>
              <span>Invitation email is sent to their address</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-accent flex-shrink-0">2.</span>
              <span>They click the link in the email</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-accent flex-shrink-0">3.</span>
              <span>They sign in (or create account if new)</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-accent flex-shrink-0">4.</span>
              <span>They accept the invitation</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-accent flex-shrink-0">5.</span>
              <span>They&apos;re automatically added to the member list</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <h4 className="text-xs font-semibold text-text-primary">Role Responsibilities</h4>
            <div className="space-y-2 text-xs text-text-muted">
              <div>
                <span className="font-medium text-accent">Admin:</span> Invite & manage members, change roles & status
              </div>
              <div>
                <span className="font-medium text-accent">Project Manager:</span> Manage projects, goals, deadlines, and actions
              </div>
              <div>
                <span className="font-medium text-accent">Moderator:</span> Create & manage goals, announcements, actions
              </div>
              <div>
                <span className="font-medium text-accent">Member:</span> Create own items, react to announcements
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
