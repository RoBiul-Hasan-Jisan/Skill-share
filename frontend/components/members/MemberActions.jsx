'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Power, Trash2, Check, ChevronRight, UserCheck } from 'lucide-react'

const ROLES = ['ADMIN', 'PROJECT_MANAGER', 'MODERATOR', 'MEMBER']

export default function MemberActions({
  member,
  onChangeRole,
  onChangeStatus,
  onRemove,
  onClose,
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [position, setPosition] = useState('right')
  const menuRef = useRef(null)

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      if (rect.right > window.innerWidth - 10) {
        setPosition('left')
      } else {
        setPosition('right')
      }

      // Position above if not enough space below
      if (rect.bottom + 300 > window.innerHeight) {
        setPosition(prev => prev + '-above')
      }
    }
  }, [])

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className={`absolute bg-surface border border-border rounded-lg shadow-2xl z-50 min-w-56 overflow-y-auto max-h-96 ${
        position.includes('above') ? 'bottom-full mb-2' : 'top-full mt-2'
      } ${
        position.includes('left') ? 'right-0' : 'left-0'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="divide-y divide-border overflow-hidden rounded-lg">
        {/* Status Toggle */}
        <button
          onClick={() => {
            onChangeStatus(member.id, !member.isActive)
            onClose()
          }}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-2 transition-colors text-text-primary text-left text-sm font-medium"
        >
          <Power className="w-4 h-4 flex-shrink-0" />
          <span>{member.isActive ? 'Deactivate' : 'Activate'}</span>
        </button>

        {/* Change Role */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-2 transition-colors text-text-primary text-left text-sm font-medium group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Change Role</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-text-muted group-hover:text-text-primary transition-transform ${showRoleMenu ? 'rotate-90' : ''}`} />
          </button>

          {/* Role Submenu */}
          {showRoleMenu && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full top-0 ml-2 bg-surface border border-border rounded-lg shadow-2xl min-w-40 z-50 overflow-hidden"
            >
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onChangeRole(member.id, role)
                    setShowRoleMenu(false)
                    onClose()
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/10 transition-colors text-text-primary text-left text-sm first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {role === member.role && <Check className="w-4 h-4 text-accent" />}
                  </div>
                  <span className={role === member.role ? 'font-semibold text-accent' : 'font-medium'}>
                    {role}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Assign to Work */}
        <button
          onClick={() => {
            alert(`To assign work to ${member.user?.name}:\n\n1. Go to Goals or Actions\n2. Click the goal/action\n3. Click the user icon or assign dropdown\n4. Select ${member.user?.name}\n\nThey will be assigned and notified`)
            onClose()
          }}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-2 transition-colors text-text-primary text-left text-sm font-medium"
        >
          <UserCheck className="w-4 h-4 flex-shrink-0" />
          <span>Assign to Work</span>
        </button>

        {/* Remove Member */}
        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-red-400 text-left text-sm font-medium"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span>Remove Member</span>
          </button>
        ) : (
          <div className="px-4 py-3 space-y-3 bg-surface">
            <div className="text-sm text-text-primary font-medium">Remove {member.user?.name}?</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setConfirmRemove(false)
                }}
                className="flex-1 px-3 py-2 text-xs bg-surface-2 hover:bg-surface-2/80 rounded transition-colors text-text-primary font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemove(member.id)
                  setConfirmRemove(false)
                  onClose()
                }}
                className="flex-1 px-3 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
