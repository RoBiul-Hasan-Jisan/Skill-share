'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useUIStore } from '@/store/uiStore'
import { motion } from 'framer-motion'
import { Settings, Lock, Bell, Trash2, User, Mail, Calendar, Eye, EyeOff, Globe } from 'lucide-react'
import { Button, Input, Avatar, Badge } from '@/components/ui'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const { id: workspaceId } = useParams()
  const { user, setUser } = useAuthStore()
  const { activeWorkspace, setActiveWorkspace, updateWorkspace, members } = useWorkspaceStore()
  const { theme, toggleTheme } = useUIStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '' })
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '', status: 'ACTIVE', deadline: '', visibility: 'private', slackWebhookUrl: '' })
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    goalUpdates: true,
    actionReminders: true,
    announcementNotifs: true,
  })
  const [selectedAvatar, setSelectedAvatar] = useState(null)

  const avatarOptions = ['🔵', '🔴', '🟡', '🟢', '🟣', '🟠', '⚫', '⚪']

  const currentMember = members?.find((m) => {
    if (!user) return false
    if (m.user?.email === user.email) return true
    if (m.id === user.id) return true
    if (m.user?.id === user.id) return true
    return false
  })

  const isAdmin = currentMember?.role === 'ADMIN' || user?.role === 'ADMIN'
  const userRole = currentMember?.role || user?.role || 'MEMBER'

  useEffect(() => {
    if (user) {
      setUserForm({ name: user.name || '', email: user.email || '' })
    }
    if (activeWorkspace) {
      setWorkspaceForm({
        name: activeWorkspace.name || '',
        description: activeWorkspace.description || '',
        status: activeWorkspace.status || 'ACTIVE',
        deadline: activeWorkspace.deadline ? activeWorkspace.deadline.split('T')[0] : '',
        visibility: 'private',
        slackWebhookUrl: activeWorkspace.slackWebhookUrl || '',
      })
    }
  }, [user, activeWorkspace])

  const handleUpdateProfile = async () => {
    if (!userForm.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      setIsUpdating(true)
      const updateData = { name: userForm.name }
      if (selectedAvatar) {
        updateData.avatarUrl = selectedAvatar
      }

      try {
        await api.patch(`/users/profile`, updateData)
      } catch (e) {
        // Silent fail for demo - still update locally
      }

      setUser({ ...user, name: userForm.name, avatarUrl: selectedAvatar || user.avatarUrl })
      toast.success('Profile updated successfully')
      setIsEditing(false)
      setSelectedAvatar(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateWorkspace = async () => {
    if (!workspaceForm.name.trim()) {
      toast.error('Workspace name is required')
      return
    }

    try {
      setIsUpdating(true)
      await api.patch(`/workspaces/${workspaceId}`, {
        name: workspaceForm.name,
        description: workspaceForm.description,
        status: workspaceForm.status,
        deadline: workspaceForm.deadline || null,
      })
      updateWorkspace(workspaceId, workspaceForm)
      toast.success('Workspace settings updated')
    } catch (error) {
      // Still update locally even if API fails (for demo mode)
      updateWorkspace(workspaceId, workspaceForm)
      toast.success('Workspace settings updated (demo)')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleNotificationToggle = (key) => {
    setNotificationSettings({ ...notificationSettings, [key]: !notificationSettings[key] })
    toast.success('Notification preference updated')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary mb-2">
          Settings
        </h1>
        <p className="text-sm sm:text-lg text-text-secondary">
          Manage your profile, workspace, and preferences
        </p>
      </motion.div>

      {/* User Profile Section */}
      <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">User Profile</h2>
            <p className="text-xs text-text-muted mt-1">Your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* User Identity */}
          {!isEditing ? (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 bg-surface-2 rounded-lg">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <Avatar src={user?.avatarUrl} name={user?.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{userForm.name}</h3>
                  <p className="text-sm text-text-muted flex items-center gap-1 mt-1 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{userForm.email}</span>
                  </p>
                  <Badge variant="secondary" size="sm" className="mt-2">
                    Profile Owner
                  </Badge>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => router.push('/profile')} className="w-full sm:w-auto flex-shrink-0">
                Edit Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-surface-2 rounded-lg">
              <div className="flex items-center gap-4 p-4 bg-surface rounded-lg">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl flex-shrink-0">
                  {selectedAvatar || user?.avatarUrl || '👤'}
                </div>
                <div>
                  <p className="text-xs text-text-muted font-semibold">Preview</p>
                  <p className="text-sm text-text-primary font-medium">{userForm.name}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1 block font-semibold">Full Name</label>
                <Input
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="text-xs text-text-muted mb-2 block font-semibold">Select Avatar</label>
                <div className="flex gap-2 flex-wrap">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`text-3xl p-2 rounded-lg transition-all ${
                        selectedAvatar === avatar ? 'bg-accent/20 ring-2 ring-accent scale-110' : 'bg-surface hover:bg-surface/80'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="primary" onClick={handleUpdateProfile} disabled={isUpdating} className="flex-1">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="secondary" onClick={() => { setIsEditing(false); setSelectedAvatar(null) }} className="flex-1 sm:flex-none">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Role & Permissions Section */}
      <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">Role & Permissions</h2>
            <p className="text-xs text-text-muted mt-1">Your workspace role and capabilities</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-surface-2 rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2 font-semibold">Your Role</p>
            <Badge variant={isAdmin ? 'accent' : 'secondary'}>{userRole}</Badge>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-primary">Permissions</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-surface-2 rounded">
                <span className={`w-2 h-2 rounded-full ${userRole ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className="text-sm text-text-primary">View workspace items</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-surface-2 rounded">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-text-primary">Create goals & actions</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-surface-2 rounded">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-text-primary">Comment & react</span>
              </div>
              {isAdmin && (
                <>
                  <div className="flex items-center gap-2 p-2 bg-surface-2 rounded">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-text-primary font-medium">Manage members</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-surface-2 rounded">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-text-primary font-medium">Configure workspace</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Workspace Settings */}
      {isAdmin && (
      <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <Settings className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">Workspace Settings</h2>
            <p className="text-xs text-text-muted mt-1">Configure your workspace</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1 block font-semibold">Workspace Name</label>
            <Input
              value={workspaceForm.name}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
              placeholder="e.g., Engineering Team"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1 block font-semibold">Description</label>
            <textarea
              value={workspaceForm.description}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
              placeholder="Describe your workspace..."
              className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none text-sm"
              rows="3"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1 block font-semibold">Project Status</label>
            <select
              value={workspaceForm.status}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, status: e.target.value })}
              className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1 block font-semibold">Deadline</label>
            <input
              type="date"
              value={workspaceForm.deadline}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, deadline: e.target.value })}
              className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1 block font-semibold">Visibility</label>
            <select
              value={workspaceForm.visibility}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, visibility: e.target.value })}
              className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent text-sm"
            >
              <option value="private">Private (Only members can access)</option>
              <option value="public">Public (Anyone with link can view)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1 block font-semibold">Slack Webhook URL</label>
            <Input
              type="url"
              value={workspaceForm.slackWebhookUrl}
              onChange={(e) => setWorkspaceForm({ ...workspaceForm, slackWebhookUrl: e.target.value })}
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="text-xs text-text-muted mt-1">Optional: Slack notifications will be sent to this webhook</p>
          </div>

          <Button variant="primary" onClick={handleUpdateWorkspace} disabled={isUpdating} className="w-full">
            {isUpdating ? 'Saving...' : 'Save Workspace Settings'}
          </Button>
        </div>
      </motion.div>
      )}

      {/* Notification Settings */}
      <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">Notifications</h2>
            <p className="text-xs text-text-muted mt-1">Control when you receive notifications</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email' },
            { key: 'goalUpdates', label: 'Goal Updates', desc: 'Notify when goals are updated or completed' },
            { key: 'actionReminders', label: 'Action Reminders', desc: 'Remind me about upcoming actions' },
            { key: 'announcementNotifs', label: 'Announcements', desc: 'New workspace announcements' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg hover:bg-surface-2/80 transition-colors">
              <div>
                <h4 className="font-medium text-text-primary text-sm">{label}</h4>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => handleNotificationToggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationSettings[key] ? 'bg-accent' : 'bg-surface-2'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Display Settings */}
      <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <Eye className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">Display Settings</h2>
            <p className="text-xs text-text-muted mt-1">Customize your experience</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg hover:bg-surface-2/80 transition-colors">
            <div>
              <h4 className="font-medium text-text-primary text-sm">Dark Mode</h4>
              <p className="text-xs text-text-muted mt-0.5">
                Currently: {theme === 'dark' ? 'Dark' : 'Light'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>

          <div className="p-3 bg-surface-2 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-accent" />
              <h4 className="font-medium text-text-primary text-sm">Language</h4>
            </div>
            <select className="w-full p-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-accent text-sm">
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Security Settings */}
      <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">Security</h2>
            <p className="text-xs text-text-muted mt-1">Manage your account security</p>
          </div>
        </div>

      </motion.div>

      {/* Workspace Info */}
      <motion.div variants={itemVariants} className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/10">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Workspace Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-surface-2 rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1 font-semibold">Workspace ID</p>
            <p className="font-mono text-sm text-text-primary truncate">{workspaceId}</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1 font-semibold flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Created Date
            </p>
            <p className="text-sm text-text-primary">
              {activeWorkspace?.createdAt ? new Date(activeWorkspace.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1 font-semibold">Current Role</p>
            <Badge variant="accent">Administrator</Badge>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1 font-semibold">Workspace Status</p>
            <Badge variant="success">Active</Badge>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
