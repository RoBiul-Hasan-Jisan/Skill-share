'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Camera, LogOut, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { ProfilePhotoModal } from '@/components/profile/ProfilePhotoModal'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [profilePhoto, setProfilePhoto] = useState(user?.avatarUrl || null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || '')

  const handlePhotoSave = (base64) => {
    setProfilePhoto(base64)
    setUser({ ...user, avatarUrl: base64 })
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileAvatar', base64)
    }
    toast.success('Profile photo updated successfully')
  }

  const handlePhotoRemove = () => {
    setProfilePhoto(null)
    setUser({ ...user, avatarUrl: null })
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profileAvatar')
    }
    toast.success('Profile photo removed')
  }

  const handleSaveName = () => {
    if (!editedName.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setUser({ ...user, name: editedName })
    setIsEditingName(false)
    toast.success('Profile name updated successfully')
  }

  const handleCancelNameEdit = () => {
    setEditedName(user?.name || '')
    setIsEditingName(false)
  }

  const handleSignOut = () => {
    setUser(null)
    toast.success('Signed out successfully')
    router.push('/login')
  }

  return (
    <motion.div
      className="max-w-4xl space-y-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-4">
          PERSONAL RECORD · G2
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary mb-2">
          Profile
        </h1>
        <p className="text-text-secondary text-base">
          Personalize how you appear across your workspaces. Your name and photo travel with every comment, mention, and audit-log entry.
        </p>
      </motion.div>

      {/* Profile Photo Section */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-text-primary">
              Profile photo
            </h2>
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
              VISIBLE TO YOUR TEAMMATES
            </p>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Current Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-lg bg-text-primary flex items-center justify-center overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              )}
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                onClick={() => setShowPhotoModal(true)}
                className="bg-text-primary text-white p-2 rounded-lg hover:bg-black transition-colors"
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              {profilePhoto && (
                <button
                  onClick={handlePhotoRemove}
                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Upload Area */}
          <div className="flex-1">
            <div
              onClick={() => setShowPhotoModal(true)}
              className="border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-accent hover:bg-surface-2 transition-all text-center"
            >
              <p className="text-text-primary font-semibold tracking-tight text-lg mb-2">
                Click or drag a photo here
              </p>
              <p className="text-xs text-text-muted uppercase tracking-wider">
                JPG · PNG · WEBP / MAX 5 MB
              </p>
            </div>
          </div>
        </div>

        {/* Profile Photo Modal */}
        <ProfilePhotoModal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onSave={handlePhotoSave}
        />
      </motion.div>

      {/* Account Details Section */}
      <motion.div
        className="space-y-6 border-t border-border pt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          Account details
        </h2>
        <p className="text-text-secondary text-sm">
          Update your name below. Email and other details are tied to your sign-in.
        </p>

        <div className="space-y-6 border-t border-border pt-6">
          {/* Full Name */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-text-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-text-primary">👤</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-1">
                Full Name
              </p>
              {isEditingName ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-muted outline-none focus:border-accent transition-colors"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveName}
                      className="flex-1"
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelNameEdit}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">
                    {user?.name || 'User'}
                  </p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs text-accent hover:opacity-70 transition-opacity font-medium uppercase"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-text-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xs">✉️</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-1">
                Email
              </p>
              <p className="text-sm font-medium text-text-primary">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-text-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xs">📅</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-1">
                Member Since
              </p>
              <p className="text-sm font-medium text-text-primary">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sign Out Section */}
      <motion.div
        className="space-y-6 border-t border-border pt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          Sign out
        </h2>
        <p className="text-text-secondary text-sm">
          You&apos;ll be returned to the sign-in page. We&apos;ll keep your data safe and waiting — nothing is dropped on the way out.
        </p>

        <div className="flex items-center justify-between pt-6 border-t border-border">
          <p className="text-xs text-text-muted uppercase tracking-wider">
            END OF RECORD · PAGE G2
          </p>
          <Button
            onClick={handleSignOut}
            variant="danger"
            size="md"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            SIGN OUT
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
