'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useUIStore } from '@/store/uiStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useSocket } from '@/hooks/useSocket'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, Target, ListChecks, Megaphone, BarChart3, Activity, CalendarDays, Users, Settings, Sun, Moon, Trash2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { CreateWorkspaceModal } from '@/components/dashboard/CreateWorkspaceModal'
import Link from 'next/link'
import toast from 'react-hot-toast'

export function DashboardClient({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser, loadUser, signOut } = useAuthStore()
  const { workspaces, activeWorkspace, setWorkspaces, setActiveWorkspace } = useWorkspaceStore()
  const { sidebarOpen, toggleSidebar, theme, toggleTheme, setTheme } = useUIStore()
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()
  const [mounted, setMounted] = useState(false)
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [noWorkspace, setNoWorkspace] = useState(false)
  const toastShown = useRef(false)

  const navLinks = [
    { icon: Home, label: 'Dashboard', href: 'dashboard' },
    { icon: Target, label: 'Goals', href: 'goals' },
    { icon: ListChecks, label: 'Actions', href: 'actions' },
    { icon: Megaphone, label: 'Announcements', href: 'announcements' },
    { icon: BarChart3, label: 'Analytics', href: 'analytics' },
    { icon: Activity, label: 'Activity', href: 'activity' },
    { icon: CalendarDays, label: 'Calendar', href: 'calendar' },
    { icon: Users, label: 'Members', href: 'members' },
    { icon: Trash2, label: 'Trash', href: 'trash' },
    { icon: BookOpen, label: 'Audit', href: 'audit' },
    { icon: Settings, label: 'Settings', href: 'settings' },
  ]

  const isNavActive = (href) => {
    return pathname.includes(`/${href}`)
  }

  const isMobile = mounted && typeof window !== 'undefined' && window.innerWidth < 1024

  useSocket()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return
    if (!user) {
      loadUser()
    }
  }, [user, loadUser, mounted])

  useEffect(() => {
    if (!mounted) return
    if (workspaces.length === 0) {
      fetchWorkspaces()
    }
  }, [workspaces.length, setWorkspaces, setActiveWorkspace, mounted])

  useEffect(() => {
    if (!mounted) return
    if (activeWorkspace?.id && workspaces.length > 0) {
      fetchMembers(activeWorkspace.id)
    }
  }, [activeWorkspace?.id, mounted])

  async function fetchWorkspaces() {
    try {
      const res = await api.get('/workspaces')
      setWorkspaces(res.data.data)
      if (res.data.data.length > 0) {
        setActiveWorkspace(res.data.data[0])
        setNoWorkspace(false)
      } else {
        setNoWorkspace(true)
        if (!toastShown.current) {
          toastShown.current = true
          toast.error('Create a workspace to get started')
        }
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
    }
  }

  async function fetchMembers(workspaceId) {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/members`)
      useWorkspaceStore.setState({ members: res.data.data })
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin text-2xl">⟳</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-bg">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => toggleSidebar()}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-72 bg-surface border-r border-border flex flex-col flex-shrink-0 lg:relative lg:translate-x-0 fixed inset-y-0 left-0 z-40 lg:z-0 overflow-y-auto"
          >
            {/* Logo Section */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0 shadow-soft">
                  <span className="text-white font-bold text-sm">SS</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-text-primary truncate">SkillShare</h1>
                  <p className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-2"></span>
                    Live
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
              {/* NAV Section */}
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
                  Navigation
                </p>
                <div className="space-y-0.5">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    const active = isNavActive(link.href)
                    const hasWorkspace = workspaces.length > 0
                    const firstId = workspaces[0]?.id
                    const href = link.href === 'dashboard' ? '/dashboard' : hasWorkspace ? `/workspace/${firstId}/${link.href}` : '/dashboard'
                    const disabled = link.href !== 'dashboard' && !hasWorkspace
                    return (
                      <Link
                        key={link.href}
                        href={href}
                        onClick={(e) => {
                          if (disabled) {
                            e.preventDefault()
                            toast.error('Create a workspace first')
                            return
                          }
                          if (isMobile && sidebarOpen) {
                            toggleSidebar()
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${active
                            ? 'bg-accent/10 text-accent font-medium'
                            : disabled
                              ? 'text-text-muted/50 cursor-not-allowed'
                              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                          }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Active workspace */}
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-3 flex items-center justify-between">
                  <span>Active workspace</span>
                  <span>{noWorkspace ? '—' : (activeWorkspace?._count?.members || '—') + ' members'}</span>
                </p>
                <div className="mx-1 px-3 py-2.5 rounded-lg bg-surface-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${noWorkspace ? 'bg-text-muted' : 'bg-accent-2'}`}></div>
                    <p className={`text-sm font-medium truncate ${noWorkspace ? 'text-text-muted' : 'text-text-primary'}`}>
                      {noWorkspace ? 'No workspace' : (activeWorkspace?.name || 'Workspace')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Workspaces Section */}
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-3 flex items-center justify-between">
                  <span>Workspaces</span>
                  <button onClick={() => setShowCreateWorkspaceModal(true)} className="text-accent text-base leading-none hover:opacity-70 font-bold">+</button>
                </p>
                <div className="space-y-0.5">
                  {workspaces.map((ws) => {
                    const isActive = ws.status === 'ACTIVE'
                    return (
                      <button
                        key={ws.id}
                        onClick={() => setActiveWorkspace(ws)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center gap-2 ${activeWorkspace?.id === ws.id
                            ? 'bg-surface-2 text-text-primary font-medium'
                            : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
                          }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ws.accentColor || 'var(--accent)' }}
                        />
                        <span className="truncate flex-1">{ws.name}</span>
                        {!isActive && (
                          <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
                            {ws.status === 'ON_HOLD' ? 'Hold' : 'Done'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-border space-y-3">
              {/* Theme Selector */}
              <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1">
                {[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' }
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      theme === value
                        ? 'bg-surface text-text-primary shadow-soft'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full gradient-accent text-white flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-lg shadow-soft-lg z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-border">
                        <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                          Signed in as
                        </p>
                        <p className="text-sm font-semibold text-text-primary mt-1 truncate">
                          {user?.name || 'User'}
                        </p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <button
                          onClick={() => {
                            router.push('/profile')
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                        >
                          Your profile
                        </button>
                        <button
                          onClick={() => {
                            if (signOut) signOut()
                            else setUser(null)
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="min-h-16 bg-surface border-b border-border flex items-center justify-between flex-wrap px-4 sm:px-6 gap-2 sm:gap-4 flex-shrink-0">
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="sm"
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="hidden sm:flex flex-1" />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block w-full sm:w-64 max-w-xs">
              <GlobalSearch workspaceId={activeWorkspace?.id} />
            </div>

            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
            />

            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              className="p-2"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-accent-2" />
              ) : (
                <Moon className="w-5 h-5 text-text-secondary" />
              )}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="p-6 md:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
      />
    </div>
  )
}
